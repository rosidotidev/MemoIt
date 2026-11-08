import { TestBed } from '@angular/core/testing';
import { signedIn } from '../../domain/session';
import type { Category, CategoryData } from '../../domain/category';
import { SessionState } from '../state/session.state';
import { CategoryBackend } from './category-backend';
import { ItemBackend, ItemBackendError } from './item-backend';
import { FakeItemBackend } from './item-backend.testing';
import { ItemStore } from './item.store';
import { CategoryStore, WRITE_TIMEOUT_MS } from './category.store';

class FakeBackend extends CategoryBackend {
  stored: Category[] = [];
  removed: string[] = [];
  removeError: unknown = null;
  async list(): Promise<Category[]> {
    return [...this.stored];
  }
  async create(_uid: string, data: CategoryData): Promise<Category> {
    return { id: 'new', ...data };
  }
  async update(_uid: string, id: string, data: CategoryData): Promise<Category> {
    return { id, ...data };
  }
  async remove(_uid: string, id: string): Promise<void> {
    if (this.removeError) {
      throw this.removeError;
    }
    this.removed.push(id);
    this.stored = this.stored.filter((c) => c.id !== id);
  }
}

describe('CategoryStore.remove', () => {
  let backend: FakeBackend;
  let itemBackend: FakeItemBackend;
  let store: CategoryStore;
  const mkItem = (id: string, categoryId: string, done: boolean) => ({
    id,
    categoryId,
    title: id,
    done,
    priority: 'medium' as const,
    createdAt: 1,
  });

  beforeEach(async () => {
    backend = new FakeBackend();
    itemBackend = new FakeItemBackend();
    backend.stored = [
      { id: 'a', name: 'Books', stateLabel: 'Done', reportable: false },
      { id: 'b', name: 'Films', stateLabel: 'Done', reportable: false },
    ];
    itemBackend.stored = [mkItem('i1', 'a', false), mkItem('i2', 'a', true), mkItem('i3', 'b', false)];
    TestBed.configureTestingModule({
      providers: [
        { provide: CategoryBackend, useValue: backend },
        { provide: ItemBackend, useValue: itemBackend },
      ],
    });
    store = TestBed.inject(CategoryStore);
    TestBed.inject(ItemStore);
    TestBed.inject(SessionState).session.set(signedIn('u1'));
    TestBed.tick();
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  });

  it('deletes the Items first, then the Category, and updates both signals', async () => {
    expect(await store.remove('a')).toEqual({ ok: true });
    expect(store.byId('a')).toBeUndefined();
    expect(backend.removed).toEqual(['a']);
    expect(itemBackend.batches.map((b) => [...b].sort())).toEqual([['i1', 'i2']]);
    expect(TestBed.inject(ItemStore).forCategory('a')).toEqual([]);
    expect(TestBed.inject(ItemStore).forCategory('b').length).toBe(1);
  });

  it('leaves the Category with fewer Items when an Item batch fails, and a retry completes', async () => {
    itemBackend.removeError = new ItemBackendError('network');
    expect(await store.remove('a')).toEqual({ ok: false, error: 'network' });
    expect(store.byId('a')).toBeDefined();
    expect(backend.removed).toEqual([]);
    itemBackend.removeError = null;
    expect(await store.remove('a')).toEqual({ ok: true });
    expect(store.byId('a')).toBeUndefined();
  });

  it('keeps the Category when its own delete fails', async () => {
    backend.removeError = { code: 'permission' };
    expect(await store.remove('a')).toEqual({ ok: false, error: 'permission' });
    expect(store.byId('a')).toBeDefined();
  });

  it('times out when the Category delete hangs and keeps the Category', async () => {
    vi.useFakeTimers();
    backend.remove = () => new Promise<void>(() => undefined);
    const p = store.remove('a');
    await vi.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS);
    expect(await p).toEqual({ ok: false, error: 'timeout' });
    expect(store.byId('a')).toBeDefined();
    vi.useRealTimers();
  });

  it('discards the result when the session changes during the delete', async () => {
    let finish!: () => void;
    backend.remove = () => new Promise<void>((r) => (finish = r));
    const p = store.remove('a');
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
    TestBed.inject(SessionState).session.set(signedIn('u2'));
    TestBed.tick();
    finish();
    expect(await p).toEqual({ ok: false, error: 'unknown' });
  });

  it('answers notFound for an unknown id', async () => {
    expect(await store.remove('zzz')).toEqual({ ok: false, error: 'notFound' });
  });
});
