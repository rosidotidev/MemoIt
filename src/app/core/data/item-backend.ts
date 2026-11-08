import {
  collection,
  doc,
  deleteDoc,
  deleteField,
  getDocFromServer,
  getDocs,
  serverTimestamp,
  Timestamp,
  setDoc,
  updateDoc,
  writeBatch,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { epochNow } from '../../domain/time';
import type { Item, ItemEditData, ItemErrorCode, NewItemData, Priority } from '../../domain/item';

/** Error thrown by a backend, with a mapped `code`. */
export class ItemBackendError extends Error {
  constructor(readonly code: ItemErrorCode) {
    super(code);
  }
}

/** Swappable storage for Items. */
export abstract class ItemBackend {
  abstract list(uid: string): Promise<Item[]>;
  abstract create(uid: string, data: NewItemData): Promise<Item>;
  abstract update(uid: string, id: string, data: ItemEditData): Promise<void>;
  /** Partial write of `done` and `updatedAt` only. */
  abstract setDone(uid: string, id: string, done: boolean): Promise<void>;
  /** Physically deletes one Item. Idempotent: a missing document is not an error. */
  abstract remove(uid: string, id: string): Promise<void>;
  /** Deletes up to 500 Items in one atomic batch. Idempotent like `remove`. */
  abstract removeMany(uid: string, ids: readonly string[]): Promise<void>;
  /** Reads one Item from the server (bypassing the cache); null when it does not exist. */
  abstract fetch(uid: string, id: string): Promise<Item | null>;
}

export function mapItemError(e: unknown): ItemErrorCode {
  const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
  switch (code.replace(/^firestore\//, '')) {
    case 'unavailable':
    case 'cancelled':
    case 'aborted':
    case 'resource-exhausted':
      return 'network';
    case 'deadline-exceeded':
      return 'timeout';
    case 'permission-denied':
    case 'unauthenticated':
      return 'permission';
    case 'invalid-argument':
      return 'invalid';
    case 'not-found':
      return 'notFound';
    default:
      return 'unknown';
  }
}

/** Full document for a new Item. Absent means absent: no description, deadline or value fields when unset. */
export function toDoc(data: NewItemData): DocumentData {
  const d: DocumentData = {
    categoryId: data.categoryId,
    title: data.title,
    done: false,
    priority: data.priority ?? 'medium',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
  if (data.description) {
    d['description'] = data.description;
  }
  if (data.deadline !== undefined) {
    d['deadline'] = Timestamp.fromMillis(data.deadline);
  }
  if (data.value !== undefined) {
    d['value'] = data.value;
  }
  return d;
}

/**
 * Partial update for an edit: Title, Description and updatedAt always change; priority and deadline only when
 * given, so createdAt and done stay as stored. An empty Description, a null deadline or a null value removes the field.
 */
export function toUpdateDoc(data: ItemEditData): DocumentData {
  const d: DocumentData = {
    title: data.title,
    description: data.description ? data.description : deleteField(),
    updatedAt: serverTimestamp(),
  };
  if (data.priority !== undefined) {
    d['priority'] = data.priority;
  }
  if (data.deadline !== undefined) {
    d['deadline'] = data.deadline === null ? deleteField() : Timestamp.fromMillis(data.deadline);
  }
  if (data.value !== undefined) {
    d['value'] = data.value === null ? deleteField() : data.value;
  }
  return d;
}

/** Partial update for a Done toggle: only `done` and `updatedAt`. */
export function toDoneDoc(done: boolean): DocumentData {
  return { done, updatedAt: serverTimestamp() };
}

const PRIORITIES: readonly string[] = ['low', 'medium', 'high'];

function millisOf(v: unknown): number | undefined {
  return typeof v === 'object' && v !== null && typeof (v as { toMillis?: unknown }).toMillis === 'function'
    ? (v as { toMillis: () => number }).toMillis()
    : undefined;
}

export function fromDoc(id: string, data: DocumentData): Item {
  const createdAt = millisOf(data['createdAt']) ?? 0;
  const deadline = millisOf(data['deadline']);
  const value = typeof data['value'] === 'number' && Number.isFinite(data['value']) ? data['value'] : undefined;
  const description =
    typeof data['description'] === 'string' && data['description'] !== '' ? data['description'] : undefined;
  return {
    id,
    categoryId: typeof data['categoryId'] === 'string' ? data['categoryId'] : '',
    title: typeof data['title'] === 'string' ? data['title'] : '',
    ...(description !== undefined ? { description } : {}),
    done: data['done'] === true,
    priority: PRIORITIES.includes(data['priority']) ? (data['priority'] as Priority) : 'medium',
    ...(deadline !== undefined ? { deadline } : {}),
    ...(value !== undefined ? { value } : {}),
    createdAt,
  };
}

const pathFor = (uid: string) => `users/${uid}/items`;

export class FirestoreItemBackend extends ItemBackend {
  constructor(private readonly db: Firestore) {
    super();
  }

  async list(uid: string): Promise<Item[]> {
    try {
      const snap = await getDocs(collection(this.db, pathFor(uid)));
      return snap.docs.map((d) => fromDoc(d.id, d.data()));
    } catch (e) {
      throw new ItemBackendError(mapItemError(e));
    }
  }

  async create(uid: string, data: NewItemData): Promise<Item> {
    const ref = doc(collection(this.db, pathFor(uid)));
    try {
      await setDoc(ref, toDoc(data));
    } catch (e) {
      throw new ItemBackendError(mapItemError(e));
    }
    return {
      id: ref.id,
      categoryId: data.categoryId,
      title: data.title,
      ...(data.description ? { description: data.description } : {}),
      done: false,
      priority: data.priority ?? 'medium',
      ...(data.deadline !== undefined ? { deadline: data.deadline } : {}),
      ...(data.value !== undefined ? { value: data.value } : {}),
      createdAt: epochNow(),
    };
  }

  async update(uid: string, id: string, data: ItemEditData): Promise<void> {
    try {
      await updateDoc(doc(this.db, pathFor(uid), id), toUpdateDoc(data));
    } catch (e) {
      throw new ItemBackendError(mapItemError(e));
    }
  }

  async setDone(uid: string, id: string, done: boolean): Promise<void> {
    try {
      await updateDoc(doc(this.db, pathFor(uid), id), toDoneDoc(done));
    } catch (e) {
      throw new ItemBackendError(mapItemError(e));
    }
  }

  async remove(uid: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, pathFor(uid), id));
    } catch (e) {
      throw new ItemBackendError(mapItemError(e));
    }
  }

  async removeMany(uid: string, ids: readonly string[]): Promise<void> {
    try {
      const batch = writeBatch(this.db);
      for (const id of ids) {
        batch.delete(doc(this.db, pathFor(uid), id));
      }
      await batch.commit();
    } catch (e) {
      throw new ItemBackendError(mapItemError(e));
    }
  }

  async fetch(uid: string, id: string): Promise<Item | null> {
    try {
      const snap = await getDocFromServer(doc(this.db, pathFor(uid), id));
      return snap.exists() ? fromDoc(snap.id, snap.data()) : null;
    } catch (e) {
      throw new ItemBackendError(mapItemError(e));
    }
  }
}
