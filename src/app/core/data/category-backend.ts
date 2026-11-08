import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  serverTimestamp,
  setDoc,
  updateDoc,
  type DocumentData,
  type Firestore,
} from 'firebase/firestore';
import { DEFAULT_STATE_LABEL, type Category, type CategoryData, type CategoryErrorCode } from '../../domain/category';

/** Error thrown by a backend, with a mapped `code`. */
export class CategoryBackendError extends Error {
  constructor(readonly code: CategoryErrorCode) {
    super(code);
  }
}

/** Swappable storage for Categories. */
export abstract class CategoryBackend {
  abstract list(uid: string): Promise<Category[]>;
  abstract create(uid: string, data: CategoryData): Promise<Category>;
  /** Updates name, stateLabel, reportable and updatedAt; createdAt stays untouched. */
  abstract update(uid: string, id: string, data: CategoryData): Promise<Category>;
  /** Deletes the Category document. Idempotent: a missing document is not an error. */
  abstract remove(uid: string, id: string): Promise<void>;
}

export function mapFirestoreError(e: unknown): CategoryErrorCode {
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

/** Full document for a new Category. Timestamps are set by the server. */
export function toDoc(data: CategoryData): DocumentData {
  return {
    name: data.name,
    stateLabel: data.stateLabel,
    reportable: data.reportable,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };
}

/** Fields changed by an update. `createdAt` is deliberately absent. */
export function toUpdateDoc(data: CategoryData): DocumentData {
  return {
    name: data.name,
    stateLabel: data.stateLabel,
    reportable: data.reportable,
    updatedAt: serverTimestamp(),
  };
}

export function fromDoc(id: string, data: DocumentData): Category {
  return {
    id,
    name: typeof data['name'] === 'string' ? data['name'] : '',
    stateLabel: typeof data['stateLabel'] === 'string' ? data['stateLabel'] : DEFAULT_STATE_LABEL,
    reportable: data['reportable'] === true,
  };
}

const pathFor = (uid: string) => `users/${uid}/categories`;

export class FirestoreCategoryBackend extends CategoryBackend {
  constructor(private readonly db: Firestore) {
    super();
  }

  async list(uid: string): Promise<Category[]> {
    try {
      const snap = await getDocs(collection(this.db, pathFor(uid)));
      return snap.docs.map((d) => fromDoc(d.id, d.data()));
    } catch (e) {
      throw new CategoryBackendError(mapFirestoreError(e));
    }
  }

  async create(uid: string, data: CategoryData): Promise<Category> {
    const ref = doc(collection(this.db, pathFor(uid)));
    try {
      await setDoc(ref, toDoc(data));
    } catch (e) {
      throw new CategoryBackendError(mapFirestoreError(e));
    }
    return { id: ref.id, ...data };
  }

  async update(uid: string, id: string, data: CategoryData): Promise<Category> {
    try {
      await updateDoc(doc(this.db, pathFor(uid), id), toUpdateDoc(data));
    } catch (e) {
      throw new CategoryBackendError(mapFirestoreError(e));
    }
    return { id, ...data };
  }

  async remove(uid: string, id: string): Promise<void> {
    try {
      await deleteDoc(doc(this.db, pathFor(uid), id));
    } catch (e) {
      throw new CategoryBackendError(mapFirestoreError(e));
    }
  }
}
