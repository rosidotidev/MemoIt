import { readFileSync } from 'node:fs';
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
  type RulesTestEnvironment,
} from '@firebase/rules-unit-testing';
import { PARSE_VECTORS } from '../../src/app/domain/number';
import { toPrefsDoc } from '../../src/app/core/data/preferences-backend';
import { toDoc, toDoneDoc, toUpdateDoc } from '../../src/app/core/data/item-backend';
import { Timestamp, deleteDoc, doc, getDoc, serverTimestamp, setDoc, updateDoc, writeBatch } from 'firebase/firestore';

let env: RulesTestEnvironment;

const A = 'alice';
const B = 'bob';
const now = () => serverTimestamp();
const created = Timestamp.fromDate(new Date('2026-01-01T00:00:00Z'));
const otherCreated = Timestamp.fromDate(new Date('2027-01-01T00:00:00Z'));

const cat = (over: Record<string, unknown> = {}) => ({
  name: 'Home',
  stateLabel: 'Done',
  reportable: false,
  createdAt: created,
  updatedAt: now(),
  ...over,
});
const item = (over: Record<string, unknown> = {}) => ({
  categoryId: 'c1',
  title: 'Buy milk',
  done: false,
  priority: 'medium',
  createdAt: created,
  updatedAt: now(),
  ...over,
});

const db = (uid: string | null) =>
  uid ? env.authenticatedContext(uid).firestore() : env.unauthenticatedContext().firestore();

async function seed(path: string, data: Record<string, unknown>) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}
const seedCat = (uid = A, id = 'c1') =>
  seed(`users/${uid}/categories/${id}`, { ...cat(), updatedAt: created });

beforeAll(async () => {
  env = await initializeTestEnvironment({
    projectId: 'demo-memoit',
    firestore: { rules: readFileSync('firestore.rules', 'utf8') },
  });
});
afterAll(async () => env.cleanup());
beforeEach(async () => env.clearFirestore());

describe('access', () => {
  it('denies unauthenticated read and write', async () => {
    await seedCat();
    const d = db(null);
    await assertFails(getDoc(doc(d, `users/${A}/categories/c1`)));
    await assertFails(setDoc(doc(d, `users/${A}/categories/c2`), cat()));
    await assertFails(getDoc(doc(d, `users/${A}/preferences/app`)));
    await assertFails(setDoc(doc(d, `users/${A}/items/i1`), item()));
    await assertFails(deleteDoc(doc(d, `users/${A}/categories/c1`)));
  });

  it('denies cross-user item update and delete', async () => {
    await seedCat();
    await seed(`users/${A}/items/i1`, { ...item(), updatedAt: created });
    const d = db(B);
    await assertFails(setDoc(doc(d, `users/${A}/items/i1`), item({ title: 'Hijack' })));
    await assertFails(deleteDoc(doc(d, `users/${A}/items/i1`)));
  });

  it('denies cross-user access on categories, items, preferences', async () => {
    await seedCat();
    await seed(`users/${A}/items/i1`, { ...item(), updatedAt: created });
    await seed(`users/${A}/preferences/app`, { accent: 'teal', scheme: 'light', language: 'en' });
    const d = db(B);
    await assertFails(getDoc(doc(d, `users/${A}/categories/c1`)));
    await assertFails(setDoc(doc(d, `users/${A}/categories/c2`), cat()));
    await assertFails(deleteDoc(doc(d, `users/${A}/categories/c1`)));
    await assertFails(getDoc(doc(d, `users/${A}/items/i1`)));
    await assertFails(setDoc(doc(d, `users/${A}/items/i2`), item()));
    await assertFails(getDoc(doc(d, `users/${A}/preferences/app`)));
    await assertFails(
      setDoc(doc(d, `users/${A}/preferences/app`), { accent: 'teal', scheme: 'dark', language: 'it' }),
    );
  });

  it('denies unknown paths for a signed-in user', async () => {
    const d = db(A);
    await assertFails(getDoc(doc(d, `users/${A}`)));
    await assertFails(setDoc(doc(d, `users/${A}`), { x: 1 }));
    await assertFails(setDoc(doc(d, `users/${A}/other/x`), { x: 1 }));
    await assertFails(
      setDoc(doc(d, `users/${A}/preferences/other`), { accent: 'teal', scheme: 'light', language: 'en' }),
    );
    await assertFails(setDoc(doc(d, 'stuff/x'), { x: 1 }));
    await assertFails(getDoc(doc(d, 'stuff/x')));
  });

  it('allows the owner to read and delete own data', async () => {
    await seedCat();
    const d = db(A);
    await assertSucceeds(getDoc(doc(d, `users/${A}/categories/c1`)));
    await assertSucceeds(deleteDoc(doc(d, `users/${A}/categories/c1`)));
  });
});

describe('categories', () => {
  const path = (id = 'c1') => `users/${A}/categories/${id}`;

  it('allows a valid create and update', async () => {
    const d = db(A);
    await assertSucceeds(setDoc(doc(d, path()), cat()));
    await assertSucceeds(setDoc(doc(d, path()), cat({ name: 'Work', reportable: true })));
  });

  it.each([
    ['empty name', { name: '' }],
    ['61-char name', { name: 'x'.repeat(61) }],
    ['empty stateLabel', { stateLabel: '' }],
    ['17-char stateLabel', { stateLabel: 'x'.repeat(17) }],
    ['non-bool reportable', { reportable: 'yes' }],
    ['extra key', { extra: 1 }],
    ['updatedAt not request.time', { updatedAt: created }],
    ['name not a string', { name: 5 }],
    ['createdAt not a timestamp', { createdAt: '2026-01-01' }],
  ])('denies %s', async (_n, over) => {
    await assertFails(setDoc(doc(db(A), path()), cat(over)));
  });

  it('allows the exact document the app writes (both timestamps from the server)', async () => {
    const appDoc = {
      name: 'Books',
      stateLabel: 'Done',
      reportable: false,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    };
    await assertSucceeds(setDoc(doc(db(A), path('app1')), appDoc));
    await assertSucceeds(getDoc(doc(db(A), path('app1'))));
    await assertFails(getDoc(doc(db(B), path('app1'))));
    await assertFails(setDoc(doc(db(B), path('app2')), appDoc));
  });

  it('allows the app-shaped update (updateDoc keeps createdAt) and denies another user', async () => {
    await seedCat();
    const patch = { name: 'Novels', stateLabel: 'Read', reportable: true, updatedAt: serverTimestamp() };
    await assertSucceeds(updateDoc(doc(db(A), path()), patch));
    await assertFails(updateDoc(doc(db(B), path()), patch));
    await assertFails(updateDoc(doc(db(A), path()), { ...patch, stateLabel: 'x'.repeat(17) }));
  });

  it('allows boundary lengths', async () => {
    await assertSucceeds(
      setDoc(doc(db(A), path()), cat({ name: 'x'.repeat(60), stateLabel: 'y'.repeat(16) })),
    );
  });

  it('denies a missing required field', async () => {
    const { stateLabel: _s, ...rest } = cat();
    await assertFails(setDoc(doc(db(A), path()), rest));
  });

  it('denies changing createdAt on update', async () => {
    await seedCat();
    await assertFails(setDoc(doc(db(A), path()), cat({ createdAt: otherCreated })));
  });
});

describe('items', () => {
  const path = (id = 'i1') => `users/${A}/items/${id}`;

  beforeEach(async () => {
    await seedCat();
  });

  it('allows a minimal item and a full item', async () => {
    const d = db(A);
    await assertSucceeds(setDoc(doc(d, path('i1')), item()));
    await assertSucceeds(
      setDoc(
        doc(d, path('i2')),
        item({
          description: 'x'.repeat(4000),
          title: 'y'.repeat(120),
          done: true,
          priority: 'high',
          deadline: Timestamp.fromDate(new Date('2026-12-31T00:00:00Z')),
          value: 82.4,
        }),
      ),
    );
  });

  it('allows the exact document the app creates (toDoc), with and without a description', async () => {
    const d = db(A);
    await assertSucceeds(setDoc(doc(d, path('n1')), toDoc({ categoryId: 'c1', title: 'Milk' })));
    await assertSucceeds(setDoc(doc(d, path('n2')), toDoc({ categoryId: 'c1', title: 'Milk', description: 'Semi' })));
  });

  it('allows the exact document the app creates with a Priority and a Deadline (toDoc)', async () => {
    const d = db(A);
    await assertSucceeds(
      setDoc(doc(d, path('n3')), toDoc({ categoryId: 'c1', title: 'Milk', priority: 'high', deadline: 1_800_000_000_000 })),
    );
    const data = (await getDoc(doc(d, path('n3')))).data()!;
    expect(data['priority']).toBe('high');
    expect(data['deadline'].toMillis()).toBe(1_800_000_000_000);
  });

  it('allows the app edit to set, change and clear Priority and Deadline (toUpdateDoc)', async () => {
    const d = db(A);
    await seed(path(), { ...item(), updatedAt: created });
    await assertSucceeds(updateDoc(doc(d, path()), toUpdateDoc({ title: 'T', priority: 'low', deadline: 1_800_000_000_000 })));
    let data = (await getDoc(doc(d, path()))).data()!;
    expect(data['priority']).toBe('low');
    expect(data['deadline'].toMillis()).toBe(1_800_000_000_000);
    await assertSucceeds(updateDoc(doc(d, path()), toUpdateDoc({ title: 'T', priority: 'high', deadline: null })));
    data = (await getDoc(doc(d, path()))).data()!;
    expect(data['priority']).toBe('high');
    expect(data['deadline']).toBeUndefined();
  });

  it('lets the owner delete an Item, singly and in a batch', async () => {
    for (const id of ['d1', 'd2', 'd3']) {
      await seed(path(id), { ...item(), updatedAt: created });
    }
    const d = db(A);
    await assertSucceeds(deleteDoc(doc(d, path('d1'))));
    const batch = writeBatch(d);
    batch.delete(doc(d, path('d2')));
    batch.delete(doc(d, path('d3')));
    await assertSucceeds(batch.commit());
  });

  it('allows the app edit: partial update keeps createdAt and removes a blank description', async () => {
    const d = db(A);
    await seed(path(), { ...item({ description: 'old', done: true, priority: 'high' }), updatedAt: created });
    await assertSucceeds(updateDoc(doc(d, path()), toUpdateDoc({ title: 'New', description: 'text' })));
    await assertSucceeds(updateDoc(doc(d, path()), toUpdateDoc({ title: 'Newer' })));
    const data = (await getDoc(doc(d, path()))).data()!;
    expect(data['title']).toBe('Newer');
    expect(data['description']).toBeUndefined();
    expect(data['done']).toBe(true);
    expect(data['priority']).toBe('high');
    expect(data['createdAt'].isEqual(created)).toBe(true);
    await assertFails(updateDoc(doc(db(B), path()), toUpdateDoc({ title: 'Hijack' })));
  });

  it('allows the app done toggle both ways and denies another user', async () => {
    const d = db(A);
    await seed(path(), { ...item({ description: 'keep', priority: 'high' }), updatedAt: created });
    await assertSucceeds(updateDoc(doc(d, path()), toDoneDoc(true)));
    let data = (await getDoc(doc(d, path()))).data()!;
    expect(data['done']).toBe(true);
    expect(data['title']).toBe('Buy milk');
    expect(data['description']).toBe('keep');
    await assertSucceeds(updateDoc(doc(d, path()), toDoneDoc(false)));
    data = (await getDoc(doc(d, path()))).data()!;
    expect(data['done']).toBe(false);
    await assertFails(updateDoc(doc(db(B), path()), toDoneDoc(true)));
  });

  it('allows an integer value and an update', async () => {
    const d = db(A);
    await assertSucceeds(setDoc(doc(d, path()), item({ value: 3 })));
    await assertSucceeds(setDoc(doc(d, path()), item({ value: 4, done: true })));
  });

  it.each(PARSE_VECTORS.filter((v) => v.value !== null).map((v) => [v.text, v.value] as const))(
    'allows the shared vector %j as value %s',
    async (_t, value) => {
      await assertSucceeds(setDoc(doc(db(A), path()), item({ value })));
    },
  );

  it.each([
    ['NaN', NaN],
    ['Infinity', Infinity],
    ['-Infinity', -Infinity],
    ['1e12', 1e12],
    ['-1e12', -1e12],
  ])('denies value %s', async (_n, value) => {
    await assertFails(setDoc(doc(db(A), path()), item({ value })));
  });

  it.each([
    ['empty title', { title: '' }],
    ['121-char title', { title: 'x'.repeat(121) }],
    ['4001-char description', { description: 'x'.repeat(4001) }],
    ['priority urgent', { priority: 'urgent' }],
    ['deadline not a timestamp', { deadline: '2026-12-31' }],
    ['value as string', { value: '12' }],
    ['unknown key', { extra: true }],
    ['non-bool done', { done: 'no' }],
    ['updatedAt not request.time', { updatedAt: created }],
    ['missing category', { categoryId: 'nope' }],
  ])('denies %s', async (_n, over) => {
    await assertFails(setDoc(doc(db(A), path()), item(over)));
  });

  it('denies an item pointing at another user category', async () => {
    await seedCat(B, 'bc1');
    await assertFails(setDoc(doc(db(A), path()), item({ categoryId: 'bc1' })));
  });

  it('denies changing createdAt on update', async () => {
    await seed(path(), { ...item(), updatedAt: created });
    await assertFails(setDoc(doc(db(A), path()), item({ createdAt: otherCreated })));
  });
});

describe('preferences', () => {
  const path = `users/${A}/preferences/app`;
  const prefs = (over: Record<string, unknown> = {}) => ({
    accent: 'teal',
    scheme: 'system',
    language: 'en',
    ...over,
  });

  it('allows a preset and a custom accent', async () => {
    const d = db(A);
    await assertSucceeds(setDoc(doc(d, path), prefs()));
    await assertSucceeds(
      setDoc(doc(d, path), prefs({ accent: 'custom', hue: 360, chroma: 0.3, scheme: 'dark', language: 'it' })),
    );
    await assertSucceeds(
      setDoc(doc(d, path), prefs({ accent: 'custom', hue: 0, chroma: 0, scheme: 'light' })),
    );
  });

  it('allows the document the app really writes (toPrefsDoc)', async () => {
    const d = db(A);
    await assertSucceeds(setDoc(doc(d, path), toPrefsDoc({ accent: 'teal', scheme: 'dark', language: 'it' })));
    await assertSucceeds(
      setDoc(doc(d, path), toPrefsDoc({ accent: 'custom', hue: 200, chroma: 0.12, scheme: 'system', language: 'en' })),
    );
  });

  it.each([
    ['hue 361', { accent: 'custom', hue: 361, chroma: 0.1 }],
    ['hue -1', { accent: 'custom', hue: -1, chroma: 0.1 }],
    ['chroma 0.31', { accent: 'custom', hue: 10, chroma: 0.31 }],
    ['custom without hue/chroma', { accent: 'custom' }],
    ['scheme sepia', { scheme: 'sepia' }],
    ['language fr', { language: 'fr' }],
    ['unknown key', { extra: 1 }],
    ['hue on a preset', { hue: 10, chroma: 0.1 }],
    ["accent ''", { accent: '' }],
    ['accent of 33 chars', { accent: 'x'.repeat(33) }],
    ['accent as number', { accent: 5 }],
    ['updatedAt not request.time', { updatedAt: created }],
    ['hue as string', { accent: 'custom', hue: '10', chroma: 0.1 }],
  ])('denies %s', async (_n, over) => {
    await assertFails(setDoc(doc(db(A), path), prefs(over)));
  });

  it('allows a write with updatedAt serverTimestamp', async () => {
    await assertSucceeds(setDoc(doc(db(A), path), prefs({ updatedAt: now() })));
  });
});
