import { TestBed } from '@angular/core/testing';
import { signedIn, SIGNED_OUT_SESSION } from '../../domain/session';
import { SessionState } from '../state/session.state';
import type { Item } from '../../domain/item';
import { ItemBackend, ItemBackendError } from './item-backend';
import { FakeItemBackend } from './item-backend.testing';
import { BATCH_SIZE, ItemStore, ITEM_WRITE_TIMEOUT_MS } from './item.store';

describe('ItemStore clearing', () => {
  let backend: FakeItemBackend;
  let store: ItemStore;
  const mk = (id: string, categoryId: string, done: boolean): Item => ({
    id,
    categoryId,
    title: id,
    done,
    priority: 'medium',
    createdAt: 1,
  });
  const flush = async () => {
    TestBed.tick();
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  };

  beforeEach(async () => {
    backend = new FakeItemBackend();
    TestBed.configureTestingModule({ providers: [{ provide: ItemBackend, useValue: backend }] });
    store = TestBed.inject(ItemStore);
    backend.stored = [mk('a', 'k1', false), mk('b', 'k1', true), mk('c', 'k1', true), mk('d', 'k2', true)];
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    await flush();
  });
  afterEach(() => vi.useRealTimers());

  it('removeDone deletes only the Done Items of that Category', async () => {
    expect(await store.removeDone('k1')).toEqual({ ok: true, count: 2 });
    expect(store.forCategory('k1').map((i) => i.id)).toEqual(['a']);
    expect(store.countsFor('k2').done).toBe(1);
    expect(backend.batches.map((b) => [...b].sort())).toEqual([['b', 'c']]);
  });

  it('removeDone with nothing Done is ok and writes nothing', async () => {
    expect(await store.removeDone('none')).toEqual({ ok: true, count: 0 });
    expect(backend.batches).toEqual([]);
  });

  it('deletes in batches of at most 500 and a failure midway keeps the rest for a retry', async () => {
    backend.stored = Array.from({ length: BATCH_SIZE + 20 }, (_, i) => mk(`x${i}`, 'big', true));
    store.reload();
    await flush();
    backend.removeError = new ItemBackendError('network');
    backend.failBatch = 2;
    expect(await store.removeDone('big')).toEqual({ ok: false, error: 'network' });
    expect(backend.batches.map((b) => b.length)).toEqual([BATCH_SIZE, 20]);
    expect(store.forCategory('big').length).toBe(20);
    backend.removeError = null;
    expect(await store.removeDone('big')).toEqual({ ok: true, count: 20 });
    expect(store.forCategory('big').length).toBe(0);
  });

  it('keeps every Item when the first batch times out', async () => {
    vi.useFakeTimers();
    backend.hang = true;
    const p = store.removeDone('k1');
    await vi.advanceTimersByTimeAsync(ITEM_WRITE_TIMEOUT_MS);
    expect(await p).toEqual({ ok: false, error: 'timeout' });
    expect(store.forCategory('k1').length).toBe(3);
  });

  it('removeAll deletes Open and Done Items of a Category', async () => {
    expect(await store.removeAll('k1')).toEqual({ ok: true, count: 3 });
    expect(store.forCategory('k1')).toEqual([]);
    expect(store.forCategory('k2').length).toBe(1);
  });

  it('discards a batch confirmed after the session changed', async () => {
    let finish!: () => void;
    backend.removeMany = () => new Promise<void>((r) => (finish = r));
    const p = store.removeDone('k1');
    TestBed.inject(SessionState).session.set(signedIn('u2'));
    await flush();
    finish();
    expect(await p).toEqual({ ok: false, error: 'unknown' });
  });

  it('refuses when the store is not ready', async () => {
    TestBed.inject(SessionState).session.set(SIGNED_OUT_SESSION);
    await flush();
    expect(await store.removeDone('k1')).toEqual({ ok: false, error: 'unknown' });
  });
});
