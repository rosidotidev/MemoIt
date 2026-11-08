import type { Item, ItemEditData, NewItemData } from '../../domain/item';
import { ItemBackend } from './item-backend';

/** In-memory ItemBackend for specs. */
export class FakeItemBackend extends ItemBackend {
  stored: Item[] = [];
  listError: unknown = null;
  createError: unknown = null;
  hang = false;
  listCalls = 0;
  created: NewItemData[] = [];
  updated: { id: string; data: ItemEditData }[] = [];
  updateError: unknown = null;
  setDoneError: unknown = null;
  fetchError: unknown = null;
  removeError: unknown = null;
  /** Batches passed to removeMany, in order. */
  batches: string[][] = [];
  /** 1-based batch number that fails with `removeError` (0 = none). */
  failBatch = 0;
  /** Ids passed to remove, in order. */
  removed: string[] = [];
  /** Calls to setDone and fetch, in order. */
  calls: string[] = [];
  doneWrites: { id: string; done: boolean }[] = [];
  /** Added to every created Item's createdAt so tests control the order. */
  clock = 1000;

  async list(): Promise<Item[]> {
    this.listCalls++;
    if (this.listError) {
      throw this.listError;
    }
    return [...this.stored];
  }

  async create(_uid: string, data: NewItemData): Promise<Item> {
    this.created.push(data);
    if (this.hang) {
      return new Promise<Item>(() => undefined);
    }
    if (this.createError) {
      throw this.createError;
    }
    return {
      id: `i${this.created.length}`,
      categoryId: data.categoryId,
      title: data.title,
      ...(data.description ? { description: data.description } : {}),
      done: false,
      priority: data.priority ?? 'medium',
      ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
      ...(data.value !== undefined ? { value: data.value } : {}),
      createdAt: this.clock++,
    };
  }

  async update(_uid: string, id: string, data: ItemEditData): Promise<void> {
    this.updated.push({ id, data });
    if (this.hang) {
      return new Promise<void>(() => undefined);
    }
    if (this.updateError) {
      throw this.updateError;
    }
  }

  async setDone(_uid: string, id: string, done: boolean): Promise<void> {
    this.calls.push(`setDone:${id}`);
    this.doneWrites.push({ id, done });
    if (this.hang) {
      return new Promise<void>(() => undefined);
    }
    if (this.setDoneError) {
      throw this.setDoneError;
    }
  }

  async remove(_uid: string, id: string): Promise<void> {
    this.calls.push(`remove:${id}`);
    this.removed.push(id);
    if (this.hang) {
      return new Promise<void>(() => undefined);
    }
    if (this.removeError) {
      throw this.removeError;
    }
    this.stored = this.stored.filter((i) => i.id !== id);
  }

  async removeMany(_uid: string, ids: readonly string[]): Promise<void> {
    this.batches.push([...ids]);
    if (this.hang) {
      return new Promise<void>(() => undefined);
    }
    if (this.removeError && (this.failBatch === 0 || this.failBatch === this.batches.length)) {
      throw this.removeError;
    }
    this.stored = this.stored.filter((i) => !ids.includes(i.id));
  }

  async fetch(_uid: string, id: string): Promise<Item | null> {
    this.calls.push(`fetch:${id}`);
    if (this.fetchError) {
      throw this.fetchError;
    }
    return this.stored.find((i) => i.id === id) ?? null;
  }
}
