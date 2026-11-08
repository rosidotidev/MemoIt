import { Injectable, computed, effect, inject, signal, untracked } from '@angular/core';
import {
  DEFAULT_STATE_LABEL,
  normalizeName,
  validateName,
  validateStateLabel,
  type AddResult,
  type Category,
  type CategoryErrorCode,
  type UpdateResult,
} from '../../domain/category';
import { SessionState } from '../state/session.state';
import { CategoryBackend } from './category-backend';
import { ItemStore } from './item.store';

export type CategoryStatus = 'loading' | 'ready' | 'error';

export type DeleteCategoryResult =
  | { readonly ok: true }
  | { readonly ok: false; readonly error: CategoryErrorCode };

export const WRITE_TIMEOUT_MS = 10_000;

const CODES: readonly string[] = ['network', 'timeout', 'permission', 'invalid', 'notFound', 'unknown'];

function toCode(e: unknown): CategoryErrorCode {
  const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
  return CODES.includes(code) ? (code as CategoryErrorCode) : 'unknown';
}

/** Loads the User's Categories once; writes update the signal only after the backend confirms. */
@Injectable({ providedIn: 'root' })
export class CategoryStore {
  private readonly backend = inject(CategoryBackend);
  private readonly itemStore = inject(ItemStore);
  private readonly session = inject(SessionState).session;
  private uid: string | null = null;
  /** Changes with the signed-in identity; results captured under another value are discarded. */
  private sessionToken = 0;
  private loadSeq = 0;
  private readonly statusSignal = signal<CategoryStatus>('loading');
  private readonly items = signal<readonly Category[]>([]);

  readonly status = this.statusSignal.asReadonly();
  /** Sorted by name. */
  readonly categories = computed(() =>
    [...this.items()].sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' })),
  );

  constructor() {
    effect(() => {
      const s = this.session();
      const uid = s.kind === 'signedIn' ? s.uid : null;
      untracked(() => this.switchTo(uid));
    });
  }

  byId(id: string): Category | undefined {
    return this.items().find((c) => c.id === id);
  }

  reload(): void {
    if (this.uid) {
      void this.load(this.uid);
    }
  }

  async add(name: string, reportable = false): Promise<AddResult> {
    const uid = this.uid;
    if (!uid) {
      return { ok: false, error: 'unknown' };
    }
    if (this.statusSignal() !== 'ready') {
      return { ok: false, error: 'unknown' };
    }
    const invalid = validateName(name, this.items());
    if (invalid) {
      return { ok: false, error: invalid };
    }
    const token = this.sessionToken;
    try {
      const category = await this.withTimeout(
        this.backend.create(uid, {
          name: normalizeName(name),
          stateLabel: DEFAULT_STATE_LABEL,
          reportable,
        }),
      );
      if (token !== this.sessionToken) {
        return { ok: false, error: 'unknown' };
      }
      this.items.update((list) => [...list.filter((c) => c.id !== category.id), category]);
      return { ok: true, category };
    } catch (e) {
      return { ok: false, error: toCode(e) };
    }
  }

  /** Saves the full resulting Category; the signal changes only after the backend confirms. */
  async update(
    id: string,
    patch: { name?: string; stateLabel?: string; reportable?: boolean },
  ): Promise<UpdateResult> {
    const uid = this.uid;
    const current = this.byId(id);
    if (!uid || this.statusSignal() !== 'ready' || !current) {
      return { ok: false, error: !uid || this.statusSignal() !== 'ready' ? 'unknown' : 'notFound' };
    }
    const name = normalizeName(patch.name ?? current.name);
    const stateLabel = (patch.stateLabel ?? current.stateLabel).trim();
    const invalid = validateName(name, this.items(), id);
    if (invalid) {
      return { ok: false, error: invalid };
    }
    const labelError = validateStateLabel(stateLabel);
    if (labelError) {
      return { ok: false, error: labelError === 'empty' ? 'labelEmpty' : 'labelInvalid' };
    }
    const token = this.sessionToken;
    try {
      const category = await this.withTimeout(
        this.backend.update(uid, id, { name, stateLabel, reportable: patch.reportable ?? current.reportable }),
      );
      if (token !== this.sessionToken) {
        return { ok: false, error: 'unknown' };
      }
      this.items.update((list) => list.map((c) => (c.id === id ? category : c)));
      return { ok: true, category };
    } catch (e) {
      return { ok: false, error: toCode(e) };
    }
  }

  /**
   * Deletes a Category: its Items first, in batches, then the Category document (AD-6). Returns ok only
   * after the document is gone. A failure midway leaves the Category with fewer Items; a retry finishes.
   */
  async remove(id: string): Promise<DeleteCategoryResult> {
    const uid = this.uid;
    if (!uid || this.statusSignal() !== 'ready' || !this.byId(id)) {
      return { ok: false, error: !uid || this.statusSignal() !== 'ready' ? 'unknown' : 'notFound' };
    }
    const token = this.sessionToken;
    const cleared = await this.itemStore.removeAll(id);
    if (!cleared.ok) {
      return { ok: false, error: cleared.error };
    }
    if (token !== this.sessionToken) {
      return { ok: false, error: 'unknown' };
    }
    try {
      await this.withTimeout(this.backend.remove(uid, id));
      if (token !== this.sessionToken) {
        return { ok: false, error: 'unknown' };
      }
      this.items.update((list) => list.filter((c) => c.id !== id));
      return { ok: true };
    } catch (e) {
      return { ok: false, error: token !== this.sessionToken ? 'unknown' : toCode(e) };
    }
  }

  private switchTo(uid: string | null): void {
    if (uid === this.uid) {
      return;
    }
    this.uid = uid;
    this.sessionToken++;
    this.loadSeq++;
    this.items.set([]);
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
      this.items.set(list);
      this.statusSignal.set('ready');
    } catch {
      if (token === this.sessionToken && seq === this.loadSeq) {
        this.statusSignal.set('error');
      }
    }
  }

  private withTimeout<T>(p: Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timer = setTimeout(() => reject({ code: 'timeout' }), WRITE_TIMEOUT_MS);
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
