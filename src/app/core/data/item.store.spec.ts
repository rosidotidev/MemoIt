import { TestBed } from '@angular/core/testing';
import { signedIn, SIGNED_OUT_SESSION } from '../../domain/session';
import { SessionState } from '../state/session.state';
import type { Item } from '../../domain/item';
import { ItemBackendError, ItemBackend, fromDoc, toDoc, toUpdateDoc } from './item-backend';
import { FakeItemBackend } from './item-backend.testing';
import { ItemStore, ITEM_WRITE_TIMEOUT_MS } from './item.store';

describe('ItemStore', () => {
  let backend: FakeItemBackend;
  let store: ItemStore;
  let state: SessionState;
  const flush = async () => {
    TestBed.tick();
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  };

  beforeEach(() => {
    backend = new FakeItemBackend();
    TestBed.configureTestingModule({ providers: [{ provide: ItemBackend, useValue: backend }] });
    state = TestBed.inject(SessionState);
    store = TestBed.inject(ItemStore);
  });
  afterEach(() => vi.useRealTimers());

  async function signIn(uid = 'u1') {
    state.session.set(signedIn(uid));
    await flush();
  }

  it('saves a Value on add and update, clears it with null and keeps it when omitted', async () => {
    await signIn();
    const added = await store.add('k1', 'Mon', '', { priority: 'medium', deadline: null, value: 82.4 });
    expect(backend.created[0]).toMatchObject({ value: 82.4 });
    const id = added.ok ? added.item.id : '';
    const kept = await store.update(id, 'Mon', '', { priority: 'medium', deadline: null });
    expect(kept.ok && kept.item.value).toBe(82.4);
    const cleared = await store.update(id, 'Mon', '', { priority: 'medium', deadline: null, value: null });
    expect(cleared.ok && 'value' in cleared.item).toBe(false);
    expect(backend.updated[1].data.value).toBeNull();
    await store.add('k1', 'Other', '', { priority: 'medium', deadline: null, value: null });
    expect('value' in backend.created[1]).toBe(false);
  });

  it('maps Value in the document helpers, never writing null or 0 for absent', () => {
    expect('value' in toDoc({ categoryId: 'k', title: 't' })).toBe(false);
    expect(toDoc({ categoryId: 'k', title: 't', value: 0 })['value']).toBe(0);
    expect('value' in toUpdateDoc({ title: 't' })).toBe(false);
    expect(toUpdateDoc({ title: 't', value: 3 })['value']).toBe(3);
    expect(toUpdateDoc({ title: 't', value: null })['value']).toBeDefined();
    expect(fromDoc('a', { value: 4.5 }).value).toBe(4.5);
    expect('value' in fromDoc('a', { value: NaN })).toBe(false);
    expect('value' in fromDoc('a', { value: '4' })).toBe(false);
  });

  it('saves Priority and Deadline on add and on update, and clears the Deadline with null', async () => {
    backend.stored = [];
    await signIn();
    const added = await store.add('k1', 'Pay rent', '', { priority: 'high', deadline: 5000 });
    expect(added.ok && added.item.priority).toBe('high');
    expect(backend.created[0]).toMatchObject({ priority: 'high', deadline: 5000 });
    const id = added.ok ? added.item.id : '';
    const edited = await store.update(id, 'Pay rent', '', { priority: 'low', deadline: 9000 });
    expect(edited.ok && edited.item).toMatchObject({ priority: 'low', deadline: 9000 });
    expect(backend.updated[0].data).toMatchObject({ priority: 'low', deadline: 9000 });
    const cleared = await store.update(id, 'Pay rent', '', { priority: 'low', deadline: null });
    expect(cleared.ok && 'deadline' in cleared.item).toBe(false);
    expect(store.byId(id)?.deadline).toBeUndefined();
    const plain = await store.add('k1', 'No extras', '');
    expect(plain.ok && plain.item.priority).toBe('medium');
    expect(backend.created[1]).not.toHaveProperty('deadline');
  });

  it('loads once on sign in and groups by Category', async () => {
    backend.stored = [
      { id: 'a', categoryId: 'k1', title: 'A', done: false, priority: 'medium', createdAt: 1 },
      { id: 'b', categoryId: 'k2', title: 'B', done: true, priority: 'medium', createdAt: 2 },
    ];
    expect(store.status()).toBe('loading');
    await signIn();
    expect(store.status()).toBe('ready');
    expect(backend.listCalls).toBe(1);
    expect(store.forCategory('k1').map((i) => i.id)).toEqual(['a']);
    expect(store.countsFor('k2')).toEqual({ total: 1, open: 0, done: 1 });
    expect(store.countsFor('none')).toEqual({ total: 0, open: 0, done: 0 });
  });

  it('goes to error when loading fails, and reload retries', async () => {
    backend.listError = new ItemBackendError('network');
    await signIn();
    expect(store.status()).toBe('error');
    backend.listError = null;
    store.reload();
    await flush();
    expect(store.status()).toBe('ready');
  });

  it('adds an Item at the top of Open', async () => {
    await signIn();
    await store.add('k1', 'First', '');
    const result = await store.add('k1', '  Milk ', ' 2 litres ');
    expect(result.ok).toBe(true);
    expect(backend.created[1]).toEqual({ categoryId: 'k1', title: 'Milk', description: '2 litres' });
    expect(store.forCategory('k1').map((i) => i.title)).toEqual(['Milk', 'First']);
  });

  it('omits the description when blank', async () => {
    await signIn();
    await store.add('k1', 'Milk', '   ');
    expect(backend.created[0]).toEqual({ categoryId: 'k1', title: 'Milk' });
  });

  it('rejects an empty title without a write', async () => {
    await signIn();
    expect(await store.add('k1', '   ', '')).toEqual({ ok: false, error: 'empty' });
    expect(backend.created.length).toBe(0);
  });

  it('refuses to save while Items are not loaded', async () => {
    expect(await store.add('k1', 'Milk', '')).toEqual({ ok: false, error: 'unknown' });
    backend.listError = new ItemBackendError('network');
    await signIn();
    expect(await store.add('k1', 'Milk', '')).toEqual({ ok: false, error: 'unknown' });
    expect(backend.created.length).toBe(0);
  });

  it('maps a backend failure to a code and leaves the list unchanged', async () => {
    await signIn();
    backend.createError = new ItemBackendError('network');
    expect(await store.add('k1', 'Milk', '')).toEqual({ ok: false, error: 'network' });
    backend.createError = new Error('raw firebase text');
    expect(await store.add('k1', 'Milk', '')).toEqual({ ok: false, error: 'unknown' });
    expect(store.forCategory('k1')).toEqual([]);
  });

  it('times out a hanging write after 10 s', async () => {
    vi.useFakeTimers();
    await signIn();
    backend.hang = true;
    const p = store.add('k1', 'Milk', '');
    await vi.advanceTimersByTimeAsync(ITEM_WRITE_TIMEOUT_MS);
    expect(await p).toEqual({ ok: false, error: 'timeout' });
    expect(store.forCategory('k1')).toEqual([]);
  });

  describe('update', () => {
    const stored = (): Item[] => [
      { id: 'a', categoryId: 'k1', title: 'Milk', description: 'old', done: true, priority: 'high', createdAt: 7 },
    ];

    it('writes the trimmed text and keeps the other fields in the list', async () => {
      backend.stored = stored();
      await signIn();
      const result = await store.update('a', '  Oat milk ', ' 2 litres ');
      expect(result.ok).toBe(true);
      expect(backend.updated).toEqual([{ id: 'a', data: { title: 'Oat milk', description: '2 litres' } }]);
      expect(store.byId('a')).toEqual({
        id: 'a',
        categoryId: 'k1',
        title: 'Oat milk',
        description: '2 litres',
        done: true,
        priority: 'high',
        createdAt: 7,
      });
    });

    it('removes the description when it is blank', async () => {
      backend.stored = stored();
      await signIn();
      await store.update('a', 'Milk', '  ');
      expect(backend.updated[0].data).toEqual({ title: 'Milk' });
      expect(store.byId('a')!.description).toBeUndefined();
    });

    it('rejects an invalid title without a write', async () => {
      backend.stored = stored();
      await signIn();
      expect(await store.update('a', '  ', '')).toEqual({ ok: false, error: 'empty' });
      expect(backend.updated.length).toBe(0);
    });

    it('refuses an unknown id or an unloaded store', async () => {
      backend.stored = stored();
      expect(await store.update('a', 'X', '')).toEqual({ ok: false, error: 'unknown' });
      await signIn();
      expect(await store.update('zzz', 'X', '')).toEqual({ ok: false, error: 'unknown' });
      expect(backend.updated.length).toBe(0);
    });

    it('keeps the list unchanged when the write fails', async () => {
      backend.stored = stored();
      await signIn();
      backend.updateError = new ItemBackendError('network');
      expect(await store.update('a', 'New', '')).toEqual({ ok: false, error: 'network' });
      expect(store.byId('a')!.title).toBe('Milk');
    });

    it('times out a hanging write after 10 s', async () => {
      vi.useFakeTimers();
      backend.stored = stored();
      await signIn();
      backend.hang = true;
      const p = store.update('a', 'New', '');
      await vi.advanceTimersByTimeAsync(ITEM_WRITE_TIMEOUT_MS);
      expect(await p).toEqual({ ok: false, error: 'timeout' });
      expect(store.byId('a')!.title).toBe('Milk');
    });
  });

  it('clears Items on sign out and discards a write finished under another session', async () => {
    await signIn();
    await store.add('k1', 'Milk', '');
    state.session.set(SIGNED_OUT_SESSION);
    await flush();
    expect(store.items()).toEqual([]);
    expect(store.status()).toBe('loading');

    await signIn('u2');
    let release!: () => void;
    const original = backend.create.bind(backend);
    backend.create = async (uid, data) => {
      const item = await original(uid, data);
      await new Promise<void>((r) => (release = r));
      return item;
    };
    const p = store.add('k1', 'Late', '');
    await flush();
    state.session.set(signedIn('u3'));
    await flush();
    release();
    expect(await p).toEqual({ ok: false, error: 'unknown' });
    expect(store.items()).toEqual([]);
  });

  describe('remove', () => {
    const stored = (): Item[] => [
      { id: 'a', categoryId: 'k1', title: 'Milk', done: false, priority: 'medium', createdAt: 1 },
      { id: 'b', categoryId: 'k1', title: 'Eggs', done: false, priority: 'medium', createdAt: 2 },
    ];

    it('drops the Item from the signal after the backend confirms', async () => {
      backend.stored = stored();
      await signIn();
      expect(await store.remove('a')).toEqual({ ok: true });
      expect(backend.removed).toEqual(['a']);
      expect(store.byId('a')).toBeUndefined();
      expect(store.forCategory('k1').map((i) => i.id)).toEqual(['b']);
    });

    it('keeps the Item and maps the code when the write fails', async () => {
      backend.stored = stored();
      await signIn();
      backend.removeError = new ItemBackendError('permission');
      expect(await store.remove('a')).toEqual({ ok: false, error: 'permission' });
      expect(store.byId('a')).toBeDefined();
      backend.removeError = new Error('raw');
      expect(await store.remove('a')).toEqual({ ok: false, error: 'unknown' });
      expect(store.byId('a')).toBeDefined();
    });

    it('times out a hanging write after 10 s and keeps the Item', async () => {
      vi.useFakeTimers();
      backend.stored = stored();
      await signIn();
      backend.hang = true;
      const p = store.remove('a');
      await vi.advanceTimersByTimeAsync(ITEM_WRITE_TIMEOUT_MS);
      expect(await p).toEqual({ ok: false, error: 'timeout' });
      expect(store.byId('a')).toBeDefined();
    });

    it('refuses an unknown id or an unloaded store without a write', async () => {
      backend.stored = stored();
      expect(await store.remove('a')).toEqual({ ok: false, error: 'unknown' });
      await signIn();
      expect(await store.remove('zzz')).toEqual({ ok: false, error: 'unknown' });
      expect(backend.removed).toEqual([]);
    });

    it('discards a confirmed delete that resolves after the session changed', async () => {
      backend.stored = stored();
      await signIn();
      let release!: () => void;
      backend.remove = async () => {
        await new Promise<void>((r) => (release = r));
      };
      const p = store.remove('a');
      await flush();
      backend.stored = [{ id: 'a', categoryId: 'k1', title: 'Other', done: false, priority: 'medium', createdAt: 1 }];
      await signIn('u2');
      release();
      expect(await p).toEqual({ ok: false, error: 'unknown' });
      expect(store.byId('a')).toBeDefined();
    });

    it('discards the result of a previous session', async () => {
      vi.useFakeTimers();
      backend.stored = stored();
      await signIn();
      backend.hang = true;
      const p = store.remove('a');
      state.session.set(SIGNED_OUT_SESSION);
      await flush();
      await vi.advanceTimersByTimeAsync(ITEM_WRITE_TIMEOUT_MS);
      expect(await p).toEqual({ ok: false, error: 'unknown' });
      expect(store.items()).toEqual([]);
    });
  });

  describe('toggleDone', () => {
    const stored = (): Item[] => [
      { id: 'a', categoryId: 'k1', title: 'Milk', done: false, priority: 'medium', createdAt: 1 },
    ];

    it('flips the signal before the write resolves, then confirms', async () => {
      backend.stored = stored();
      await signIn();
      const p = store.toggleDone('a');
      expect(store.byId('a')!.done).toBe(true);
      expect(store.countsFor('k1')).toEqual({ total: 1, open: 0, done: 1 });
      const r = await p;
      expect(r.ok).toBe(true);
      expect(backend.doneWrites).toEqual([{ id: 'a', done: true }]);
      const back = await store.toggleDone('a');
      expect(back.ok && back.item.done).toBe(false);
      expect(backend.doneWrites[1]).toEqual({ id: 'a', done: false });
    });

    it('rolls back and maps the code when the write fails', async () => {
      backend.stored = stored();
      await signIn();
      backend.setDoneError = new ItemBackendError('network');
      expect(await store.toggleDone('a')).toEqual({ ok: false, error: 'network' });
      expect(store.byId('a')!.done).toBe(false);
    });

    it('rolls back only while the state still equals the optimistic value', async () => {
      backend.stored = stored();
      await signIn();
      let fail!: (e: unknown) => void;
      backend.setDone = () => new Promise<void>((_r, rej) => (fail = rej));
      const p = store.toggleDone('a');
      await flush();
      store['all'].update((l: readonly Item[]) => l.map((i) => ({ ...i, done: false })));
      fail(new ItemBackendError('network'));
      await p;
      expect(store.byId('a')!.done).toBe(false);
    });

    it('ignores a second toggle while the first is in flight', async () => {
      backend.stored = stored();
      await signIn();
      const first = store.toggleDone('a');
      const second = await store.toggleDone('a');
      expect(second).toEqual({ ok: false, error: 'unknown', ignored: true });
      await first;
      expect(backend.doneWrites.length).toBe(1);
      expect(store.byId('a')!.done).toBe(true);
    });

    it('reports unknown for a missing id or before ready', async () => {
      expect(await store.toggleDone('a')).toEqual({ ok: false, error: 'unknown' });
      await signIn();
      expect(await store.toggleDone('nope')).toEqual({ ok: false, error: 'unknown' });
    });

    it('after a timeout the next write first re-reads from the server', async () => {
      vi.useFakeTimers();
      backend.stored = stored();
      await signIn();
      backend.hang = true;
      const p = store.toggleDone('a');
      await vi.advanceTimersByTimeAsync(ITEM_WRITE_TIMEOUT_MS);
      expect(await p).toEqual({ ok: false, error: 'timeout' });
      expect(store.byId('a')!.done).toBe(false);
      backend.hang = false;
      backend.calls = [];
      const r = await store.toggleDone('a');
      expect(r.ok).toBe(true);
      expect(backend.calls).toEqual(['fetch:a', 'setDone:a']);
      backend.calls = [];
      await store.toggleDone('a');
      expect(backend.calls).toEqual(['setDone:a']);
    });

    it('aborts the write when the re-read fails and keeps the Item stale', async () => {
      vi.useFakeTimers();
      backend.stored = stored();
      await signIn();
      backend.hang = true;
      const p = store.toggleDone('a');
      await vi.advanceTimersByTimeAsync(ITEM_WRITE_TIMEOUT_MS);
      await p;
      backend.hang = false;
      backend.fetchError = new ItemBackendError('permission');
      backend.calls = [];
      expect(await store.toggleDone('a')).toEqual({ ok: false, error: 'permission' });
      expect(backend.calls).toEqual(['fetch:a']);
      expect(store.byId('a')!.done).toBe(false);
      backend.fetchError = null;
      await store.toggleDone('a');
      expect(backend.calls).toEqual(['fetch:a', 'fetch:a', 'setDone:a']);
    });

    it('drops an Item the re-read finds deleted, and a landed write drives the next toggle', async () => {
      vi.useFakeTimers();
      backend.stored = stored();
      await signIn();
      backend.hang = true;
      const p = store.toggleDone('a');
      await vi.advanceTimersByTimeAsync(ITEM_WRITE_TIMEOUT_MS);
      await p;
      backend.hang = false;
      backend.stored = [];
      backend.calls = [];
      expect(await store.toggleDone('a')).toEqual({ ok: false, error: 'unknown' });
      expect(backend.calls).toEqual(['fetch:a']);
      expect(store.byId('a')).toBeUndefined();
    });

    it('toggles from the server state when the timed-out write had landed', async () => {
      vi.useFakeTimers();
      backend.stored = stored();
      await signIn();
      backend.hang = true;
      const p = store.toggleDone('a');
      await vi.advanceTimersByTimeAsync(ITEM_WRITE_TIMEOUT_MS);
      await p;
      backend.hang = false;
      backend.stored = backend.stored.map((i) => (i.id === 'a' ? { ...i, done: true } : i));
      const r = await store.toggleDone('a');
      expect(r.ok).toBe(true);
      expect(backend.doneWrites[backend.doneWrites.length - 1]).toMatchObject({ id: 'a', done: false });
      expect(store.byId('a')!.done).toBe(false);
    });

    it('discards the result of a previous session', async () => {
      vi.useFakeTimers();
      backend.stored = stored();
      await signIn();
      backend.hang = true;
      const p = store.toggleDone('a');
      state.session.set(SIGNED_OUT_SESSION);
      await flush();
      await vi.advanceTimersByTimeAsync(ITEM_WRITE_TIMEOUT_MS);
      expect(await p).toEqual({ ok: false, error: 'unknown' });
      expect(store.items()).toEqual([]);
    });
  });
});

describe('item documents', () => {
  it('builds an edit with Title, Description and updatedAt only; a blank Description deletes the field', () => {
    const d = toUpdateDoc({ title: 'Milk', description: 'x' });
    expect(Object.keys(d).sort()).toEqual(['description', 'title', 'updatedAt']);
    expect(d['description']).toBe('x');
    const blank = toUpdateDoc({ title: 'Milk' });
    expect(Object.keys(blank).sort()).toEqual(['description', 'title', 'updatedAt']);
    expect(blank['description']).not.toBe('');
    expect(blank['description']).toBeTruthy();
  });

  it('writes a full document with defaults and no absent fields', () => {
    const d = toDoc({ categoryId: 'k', title: 'Milk' });
    expect(Object.keys(d).sort()).toEqual(['categoryId', 'createdAt', 'done', 'priority', 'title', 'updatedAt']);
    expect(d['done']).toBe(false);
    expect(d['priority']).toBe('medium');
    expect(toDoc({ categoryId: 'k', title: 'Milk', description: 'x' })['description']).toBe('x');
  });

  it('reads a document, treating a missing description as absent', () => {
    const item = fromDoc('i', {
      categoryId: 'k',
      title: 'T',
      done: true,
      priority: 'high',
      createdAt: { toMillis: () => 42 },
    });
    expect(item).toEqual({ id: 'i', categoryId: 'k', title: 'T', done: true, priority: 'high', createdAt: 42 });
  });

  it('reads a Timestamp deadline as milliseconds and ignores a non-Timestamp one', () => {
    const base = { categoryId: 'k', title: 'T', done: false, priority: 'low', createdAt: { toMillis: () => 1 } };
    expect(fromDoc('i', { ...base, deadline: { toMillis: () => 123 } }).deadline).toBe(123);
    expect('deadline' in fromDoc('i', { ...base, deadline: '2030-01-01' })).toBe(false);
  });

  it('writes a deadline as a Timestamp and clears it with deleteField', () => {
    const d = toDoc({ categoryId: 'k', title: 'Milk', deadline: 5000 });
    expect((d['deadline'] as { toMillis: () => number }).toMillis()).toBe(5000);
    const u = toUpdateDoc({ title: 'Milk', deadline: 7000, priority: 'high' });
    expect((u['deadline'] as { toMillis: () => number }).toMillis()).toBe(7000);
    expect(u['priority']).toBe('high');
    expect(toUpdateDoc({ title: 'Milk', deadline: null })['deadline']).not.toBeUndefined();
  });
});
