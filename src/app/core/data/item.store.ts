import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  countItems,
  sortItems,
  type AddItemResult,
  type Item,
  type ItemCounts,
  type ItemEditData,
  type ItemErrorCode,
  type Priority,
} from '../../domain/item';
import { normalizeTitle, validateDescription, validateTitle } from '../../domain/validation';
import { SessionState } from '../state/session.state';
import { ItemBackend } from './item-backend';

export type ItemStatus = 'loading' | 'ready' | 'error';

export type ToggleDoneResult =
  | { readonly ok: true; readonly item: Item }
  | { readonly ok: false; readonly error: ItemErrorCode; readonly ignored?: true };

export type RemoveItemResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: ItemErrorCode };

export type ClearItemsResult =
  | { readonly ok: true; readonly count: number }
  | { readonly ok: false; readonly error: ItemErrorCode };

export const ITEM_WRITE_TIMEOUT_MS = 10_000;
/** Firestore allows at most 500 writes per batch. */
export const BATCH_SIZE = 500;

const CODES: readonly string[] = ['network', 'timeout', 'permission', 'invalid', 'notFound', 'unknown'];

function toCode(e: unknown): ItemErrorCode {
  const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
  return CODES.includes(code) ? (code as ItemErrorCode) : 'unknown';
}

/** Priority and Deadline (epoch ms; null means none) sent with a save. */
export interface ItemExtras {
  readonly priority: Priority;
  readonly deadline: number | null;
  /** Only sent for a Reportable Category: a number sets the Value, null clears it. Omitted leaves it as stored. */
  readonly value?: number | null;
}

const deadlineField = (d: number | null | undefined, key: 'deadline' | 'value' = 'deadline') =>
  d === null || d === undefined ? {} : { [key]: d };

const NO_COUNTS: ItemCounts = { total: 0, open: 0, done: 0 };

/** Loads the User's Items once (no listeners); writes update the signal only after the backend confirms. */
@Injectable({ providedIn: 'root' })
export class ItemStore {
  private readonly backend = inject(ItemBackend);
  private readonly session = inject(SessionState).session;
  private uid: string | null = null;
  /** Changes with the signed-in identity; results captured under another value are discarded. */
  private sessionToken = 0;
  private loadSeq = 0;
  /** Items with a toggle write in flight. */
  private readonly inFlight = new Set<string>();
  /** Items whose last write timed out: the next write re-reads the document first (AD-5). */
  private readonly staleIds = new Set<string>();
  private readonly statusSignal = signal<ItemStatus>('loading');
  private readonly all = signal<readonly Item[]>([]);

  readonly status = this.statusSignal.asReadonly();
  readonly items = this.all.asReadonly();
  private readonly grouped = computed(() => {
    const map = new Map<string, Item[]>();
    for (const i of this.all()) {
      const list = map.get(i.categoryId);
      if (list) {
        list.push(i);
      } else {
        map.set(i.categoryId, [i]);
      }
    }
    return map;
  });

  constructor() {
    effect(() => {
      const s = this.session();
      const uid = s.kind === 'signedIn' ? s.uid : null;
      untracked(() => this.switchTo(uid));
    });
  }

  /** Items of one Category: Open newest first, then Done. Reads signals, so usable in computed. */
  forCategory(categoryId: string): Item[] {
    return sortItems(this.grouped().get(categoryId) ?? []);
  }

  byId(id: string): Item | undefined {
    return this.all().find((i) => i.id === id);
  }

  /** Counts of one Category. Reads signals, so usable in computed. */
  countsFor(categoryId: string): ItemCounts {
    const list = this.grouped().get(categoryId);
    return list ? countItems(list) : NO_COUNTS;
  }

  reload(): void {
    if (this.uid) {
      void this.load(this.uid);
    }
  }

  async add(categoryId: string, title: string, description: string, extras?: ItemExtras): Promise<AddItemResult> {
    const uid = this.uid;
    if (!uid || this.statusSignal() !== 'ready') {
      return { ok: false, error: 'unknown' };
    }
    const invalid = validateTitle(title) ?? validateDescription(description);
    if (invalid) {
      return { ok: false, error: invalid };
    }
    const token = this.sessionToken;
    const desc = description.trim();
    try {
      const item = await this.withTimeout(
        this.backend.create(uid, {
          categoryId,
          title: normalizeTitle(title),
          ...(desc !== '' ? { description: desc } : {}),
          ...(extras ? { priority: extras.priority } : {}),
          ...(extras && extras.deadline !== null ? { deadline: extras.deadline } : {}),
          ...(extras?.value != null ? { value: extras.value } : {}),
        }),
      );
      if (token !== this.sessionToken) {
        return { ok: false, error: 'unknown' };
      }
      this.all.update((list) => [...list.filter((i) => i.id !== item.id), item]);
      return { ok: true, item };
    } catch (e) {
      return { ok: false, error: toCode(e) };
    }
  }

  /** Saves a new Title and Description. The signal changes only after the backend confirms. */
  async update(id: string, title: string, description: string, extras?: ItemExtras): Promise<AddItemResult> {
    const uid = this.uid;
    const current = this.byId(id);
    if (!uid || this.statusSignal() !== 'ready' || !current) {
      return { ok: false, error: 'unknown' };
    }
    const invalid = validateTitle(title) ?? validateDescription(description);
    if (invalid) {
      return { ok: false, error: invalid };
    }
    const token = this.sessionToken;
    const desc = description.trim();
    const data: ItemEditData = {
      title: normalizeTitle(title),
      ...(desc !== '' ? { description: desc } : {}),
      ...(extras ? { priority: extras.priority, deadline: extras.deadline } : {}),
      ...(extras?.value !== undefined ? { value: extras.value } : {}),
    };
    try {
      await this.withTimeout(this.backend.update(uid, id, data));
      if (token !== this.sessionToken) {
        return { ok: false, error: 'unknown' };
      }
      let item: Item | undefined;
      this.all.update((list) =>
        list.map((i) => {
          if (i.id !== id) {
            return i;
          }
          item = {
            id: i.id,
            categoryId: i.categoryId,
            title: data.title,
            ...(data.description !== undefined ? { description: data.description } : {}),
            done: i.done,
            priority: data.priority ?? i.priority,
            ...deadlineField(data.deadline === undefined ? i.deadline : data.deadline),
            ...deadlineField(data.value === undefined ? i.value : data.value, 'value'),
            createdAt: i.createdAt,
          };
          return item;
        }),
      );
      if (!item) {
        return { ok: false, error: 'unknown' };
      }
      return { ok: true, item };
    } catch (e) {
      return { ok: false, error: toCode(e) };
    }
  }

  /**
   * Deletes an Item physically. The signal drops it only after the backend confirms.
   * Deleting an Item that is already gone on the server counts as ok (the delete is idempotent).
   */
  async remove(id: string): Promise<RemoveItemResult> {
    const uid = this.uid;
    if (!uid || this.statusSignal() !== 'ready' || !this.byId(id) || this.inFlight.has(id)) {
      return { ok: false, error: 'unknown' };
    }
    const token = this.sessionToken;
    try {
      await this.withTimeout(this.backend.remove(uid, id));
      if (token !== this.sessionToken) {
        return { ok: false, error: 'unknown' };
      }
      this.all.update((list) => list.filter((i) => i.id !== id));
      this.inFlight.delete(id);
      this.staleIds.delete(id);
      return { ok: true };
    } catch (e) {
      if (token !== this.sessionToken) {
        return { ok: false, error: 'unknown' };
      }
      return { ok: false, error: toCode(e) };
    }
  }

  /** Deletes the Done Items of a Category in batches of at most 500 (FR4). */
  removeDone(categoryId: string): Promise<ClearItemsResult> {
    return this.removeIds(
      this.forCategory(categoryId)
        .filter((i) => i.done)
        .map((i) => i.id),
    );
  }

  /** Deletes every Item of a Category in batches; used before the Category itself goes (AD-6). */
  removeAll(categoryId: string): Promise<ClearItemsResult> {
    return this.removeIds(this.forCategory(categoryId).map((i) => i.id));
  }

  /**
   * Batched delete. Each confirmed batch leaves the signal at once, so a failure midway keeps exactly the
   * Items not yet deleted and a retry finishes the job.
   */
  private async removeIds(ids: readonly string[]): Promise<ClearItemsResult> {
    const uid = this.uid;
    if (!uid || this.statusSignal() !== 'ready') {
      return { ok: false, error: 'unknown' };
    }
    const token = this.sessionToken;
    let count = 0;
    for (let i = 0; i < ids.length; i += BATCH_SIZE) {
      const chunk = ids.slice(i, i + BATCH_SIZE);
      try {
        await this.withTimeout(this.backend.removeMany(uid, chunk));
      } catch (e) {
        return { ok: false, error: token !== this.sessionToken ? 'unknown' : toCode(e) };
      }
      if (token !== this.sessionToken) {
        return { ok: false, error: 'unknown' };
      }
      const gone = new Set(chunk);
      this.all.update((list) => list.filter((it) => !gone.has(it.id)));
      for (const id of chunk) {
        this.inFlight.delete(id);
        this.staleIds.delete(id);
      }
      count += chunk.length;
    }
    return { ok: true, count };
  }

  /**
   * Optimistic Done toggle: the signal flips at once, the write follows, and a failure rolls the state back.
   * Undo is another call. Ignored while the same Item has a write in flight.
   */
  async toggleDone(id: string): Promise<ToggleDoneResult> {
    const uid = this.uid;
    const current = this.byId(id);
    if (!uid || this.statusSignal() !== 'ready' || !current) {
      return { ok: false, error: 'unknown' };
    }
    if (this.inFlight.has(id)) {
      return { ok: false, error: 'unknown', ignored: true };
    }
    const token = this.sessionToken;
    let next = !current.done;
    let previous = current.done;
    this.setDoneLocal(id, next);
    this.inFlight.add(id);
    try {
      if (this.staleIds.has(id)) {
        const fresh = await this.withTimeout(this.backend.fetch(uid, id));
        if (token !== this.sessionToken) {
          return { ok: false, error: 'unknown' };
        }
        if (!fresh) {
          // Deleted elsewhere: drop it locally and stop treating it as stale.
          this.staleIds.delete(id);
          this.all.update((list) => list.filter((i) => i.id !== id));
          return { ok: false, error: 'unknown' };
        }
        this.staleIds.delete(id);
        if (fresh.done !== current.done) {
          // The timed-out write landed: toggle from the server state, not the local one.
          previous = fresh.done;
          next = !fresh.done;
          this.all.update((list) => list.map((i) => (i.id === id ? { ...fresh, done: next } : i)));
        }
      }
      await this.withTimeout(this.backend.setDone(uid, id, next));
      if (token !== this.sessionToken) {
        return { ok: false, error: 'unknown' };
      }
      const item = this.byId(id);
      return item ? { ok: true, item } : { ok: false, error: 'unknown' };
    } catch (e) {
      if (token !== this.sessionToken) {
        return { ok: false, error: 'unknown' };
      }
      const code = toCode(e);
      if (code === 'timeout') {
        this.staleIds.add(id);
      }
      this.rollback(id, next, previous);
      return { ok: false, error: code };
    } finally {
      if (token === this.sessionToken) {
        this.inFlight.delete(id);
      }
    }
  }

  private setDoneLocal(id: string, done: boolean): void {
    this.all.update((list) => list.map((i) => (i.id === id ? { ...i, done } : i)));
  }

  /** Restores `previous` only if the Item still holds the optimistic value. */
  private rollback(id: string, optimistic: boolean, previous: boolean): void {
    if (this.byId(id)?.done === optimistic) {
      this.setDoneLocal(id, previous);
    }
  }

  private switchTo(uid: string | null): void {
    if (uid === this.uid) {
      return;
    }
    this.uid = uid;
    this.sessionToken++;
    this.loadSeq++;
    this.inFlight.clear();
    this.staleIds.clear();
    this.all.set([]);
    this.statusSignal.set('loading');
    if (uid) {
      void this.load(uid);
    }
  }

  private async load(uid: string): Promise<void> {
    const token = this.sessionToken;
    const seq = ++this.loadSeq;
    this.statusSignal.set('loading');
    try {
      const list = await this.backend.list(uid);
      if (token !== this.sessionToken || seq !== this.loadSeq) {
        return;
      }
      this.all.set(list);
      this.statusSignal.set('ready');
    } catch {
      if (token === this.sessionToken && seq === this.loadSeq) {
        this.statusSignal.set('error');
      }
    }
  }

  private withTimeout<T>(p: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject({ code: 'timeout' }), ITEM_WRITE_TIMEOUT_MS);
      p.then(
        (v) => {
          clearTimeout(timer);
          resolve(v);
        },
        (e: unknown) => {
          clearTimeout(timer);
          reject(e);
        },
      );
    });
  }
}
