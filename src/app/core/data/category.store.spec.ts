import { TestBed } from '@angular/core/testing';
import { signedIn, SIGNED_OUT_SESSION } from '../../domain/session';
import type { Category, CategoryData } from '../../domain/category';
import { SessionState } from '../state/session.state';
import { CategoryBackend } from './category-backend';
import { FakeItemBackend } from './item-backend.testing';
import { ItemBackend } from './item-backend';
import { CategoryStore, WRITE_TIMEOUT_MS } from './category.store';

class FakeBackend extends CategoryBackend {
  async remove(): Promise<void> {
    throw new Error('unused');
  }
  stored: Category[] = [];
  listError: unknown = null;
  createError: unknown = null;
  hang = false;
  listCalls = 0;
  created: CategoryData[] = [];
  gate: Promise<void> | null = null;
  updateError: unknown = null;
  updated: CategoryData[] = [];
  async list(): Promise<Category[]> {
    this.listCalls++;
    if (this.gate) {
      await this.gate;
    }
    if (this.listError) {
      throw this.listError;
    }
    return [...this.stored];
  }
  async create(_uid: string, data: CategoryData): Promise<Category> {
    this.created.push(data);
    if (this.hang) {
      return new Promise<Category>(() => undefined);
    }
    if (this.createError) {
      throw this.createError;
    }
    return { id: `id${this.created.length}`, ...data };
  }
  async update(_uid: string, id: string, data: CategoryData): Promise<Category> {
    this.updated.push(data);
    if (this.hang) {
      return new Promise<Category>(() => undefined);
    }
    if (this.updateError) {
      throw this.updateError;
    }
    return { id, ...data };
  }
}

describe('CategoryStore', () => {
  let backend: FakeBackend;
  let store: CategoryStore;
  let state: SessionState;
  const flush = async () => {
    TestBed.tick();
    for (let i = 0; i < 5; i++) {
      await Promise.resolve();
    }
  };

  beforeEach(() => {
    backend = new FakeBackend();
    TestBed.configureTestingModule({ providers: [
        { provide: CategoryBackend, useValue: backend },
        { provide: ItemBackend, useValue: new FakeItemBackend() },
      ],
    });
    state = TestBed.inject(SessionState);
    store = TestBed.inject(CategoryStore);
  });
  afterEach(() => vi.useRealTimers());

  async function signIn(uid = 'u1') {
    state.session.set(signedIn(uid));
    await flush();
  }

  it('loads once on sign in and sorts by name', async () => {
    backend.stored = [
      { id: 'b', name: 'beta', stateLabel: 'Done', reportable: false },
      { id: 'a', name: 'Alpha', stateLabel: 'Done', reportable: false },
    ];
    expect(store.status()).toBe('loading');
    await signIn();
    expect(store.status()).toBe('ready');
    expect(store.categories().map((c) => c.name)).toEqual(['Alpha', 'beta']);
    expect(backend.listCalls).toBe(1);
    expect(store.byId('a')?.name).toBe('Alpha');
    expect(store.byId('zz')).toBeUndefined();
  });

  it('reports a load error and reloads on retry', async () => {
    backend.listError = { code: 'unavailable' };
    await signIn();
    expect(store.status()).toBe('error');
    backend.listError = null;
    store.reload();
    expect(store.status()).toBe('loading');
    await flush();
    expect(store.status()).toBe('ready');
  });

  it('adds a trimmed Category with defaults only after the write is confirmed', async () => {
    await signIn();
    const result = await store.add('  Books ');
    expect(result).toEqual({
      ok: true,
      category: { id: 'id1', name: 'Books', stateLabel: 'Done', reportable: false },
    });
    expect(store.categories().length).toBe(1);
  });

  it('rejects empty and duplicate names without writing', async () => {
    await signIn();
    await store.add('Books');
    expect(await store.add('   ')).toEqual({ ok: false, error: 'empty' });
    expect(await store.add('books')).toEqual({ ok: false, error: 'duplicate' });
    expect(backend.created.length).toBe(1);
  });

  it('maps a failed write and leaves the list unchanged', async () => {
    await signIn();
    backend.createError = { code: 'permission' };
    expect(await store.add('Books')).toEqual({ ok: false, error: 'permission' });
    backend.createError = new Error('boom');
    expect(await store.add('Books')).toEqual({ ok: false, error: 'unknown' });
    expect(store.categories()).toEqual([]);
  });

  it('times out a write after 10 s', async () => {
    await signIn();
    vi.useFakeTimers();
    backend.hang = true;
    const p = store.add('Books');
    await vi.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS);
    expect(await p).toEqual({ ok: false, error: 'timeout' });
    expect(store.categories()).toEqual([]);
  });

  it('clears on sign out and discards a late load result', async () => {
    let release!: () => void;
    backend.gate = new Promise<void>((r) => (release = r));
    backend.stored = [{ id: 'a', name: 'Alpha', stateLabel: 'Done', reportable: false }];
    await signIn('u1');
    state.session.set(SIGNED_OUT_SESSION);
    await flush();
    release();
    await flush();
    expect(store.categories()).toEqual([]);
    expect(store.status()).toBe('loading');
  });

  it('discards an in-flight add when the session changes', async () => {
    await signIn('u1');
    let finish!: (c: Category) => void;
    backend.create = () => new Promise<Category>((r) => (finish = r));
    const p = store.add('Books');
    state.session.set(signedIn('u2'));
    await flush();
    finish({ id: 'x', name: 'Books', stateLabel: 'Done', reportable: false });
    expect((await p).ok).toBe(false);
    expect(store.categories()).toEqual([]);
  });

  describe('update', () => {
    beforeEach(async () => {
      backend.stored = [
        { id: 'a', name: 'Books', stateLabel: 'Done', reportable: false },
        { id: 'b', name: 'Films', stateLabel: 'Done', reportable: false },
      ];
      await signIn();
    });

    it('saves the full resulting document and updates the signal after confirmation', async () => {
      const r = await store.update('a', { name: ' Novels ', stateLabel: ' Read ', reportable: true });
      expect(r).toEqual({ ok: true, category: { id: 'a', name: 'Novels', stateLabel: 'Read', reportable: true } });
      expect(backend.updated).toEqual([{ name: 'Novels', stateLabel: 'Read', reportable: true }]);
      expect(store.byId('a')?.name).toBe('Novels');
    });

    it('allows the own name in another case but rejects another Category name', async () => {
      expect((await store.update('a', { name: 'books' })).ok).toBe(true);
      expect(await store.update('a', { name: 'FILMS' })).toEqual({ ok: false, error: 'duplicate' });
      expect(backend.updated.length).toBe(1);
    });

    it('rejects an empty name, empty label and 17-char label without a write', async () => {
      expect(await store.update('a', { name: '  ' })).toEqual({ ok: false, error: 'empty' });
      expect(await store.update('a', { stateLabel: ' ' })).toEqual({ ok: false, error: 'labelEmpty' });
      expect(await store.update('a', { stateLabel: 'x'.repeat(17) })).toEqual({ ok: false, error: 'labelInvalid' });
      expect(backend.updated.length).toBe(0);
    });

    it('returns notFound for an unknown id', async () => {
      expect(await store.update('zz', { name: 'X' })).toEqual({ ok: false, error: 'notFound' });
    });

    it('maps a failed write and leaves the list unchanged', async () => {
      backend.updateError = { code: 'permission' };
      expect(await store.update('a', { name: 'Novels' })).toEqual({ ok: false, error: 'permission' });
      expect(store.byId('a')?.name).toBe('Books');
    });

    it('times out after 10 s', async () => {
      vi.useFakeTimers();
      backend.hang = true;
      const p = store.update('a', { name: 'Novels' });
      await vi.advanceTimersByTimeAsync(WRITE_TIMEOUT_MS);
      expect(await p).toEqual({ ok: false, error: 'timeout' });
      expect(store.byId('a')?.name).toBe('Books');
    });

    it('discards a result confirmed after the session changed', async () => {
      let finish!: (c: Category) => void;
      backend.update = () => new Promise<Category>((r) => (finish = r));
      const p = store.update('a', { name: 'Novels' });
      state.session.set(signedIn('u2'));
      await flush();
      finish({ id: 'a', name: 'Novels', stateLabel: 'Done', reportable: false });
      expect((await p).ok).toBe(false);
      expect(store.byId('a')?.name).toBe('Books');
    });
  });
});
