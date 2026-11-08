import { Injectable, inject, signal } from '@angular/core';
import { initialDraft, type Item, type ItemDraft } from '../../domain/item';
import { SessionScope } from './session-scope';

const keyOf = (categoryId: string, itemId?: string) => (itemId ? `${categoryId}/${itemId}` : categoryId);

/** Unsaved Item form text, one per new-Item form (by Category) and per edited Item. Survives a failed save; dropped after save, Cancel or session change. */
@Injectable({ providedIn: 'root' })
export class DraftStore {
  private readonly drafts = signal<Readonly<Record<string, ItemDraft>>>({});

  constructor() {
    inject(SessionScope).registerReset(() => this.drafts.set({}));
  }

  /** The stored draft, or a fresh one: empty for a new Item, the stored values when editing `item`. */
  get(categoryId: string, item?: Item): ItemDraft {
    return this.drafts()[keyOf(categoryId, item?.id)] ?? initialDraft(categoryId, item);
  }

  set(draft: ItemDraft): void {
    this.drafts.update((d) => ({ ...d, [keyOf(draft.categoryId, draft.itemId)]: draft }));
  }

  drop(categoryId: string, itemId?: string): void {
    this.drafts.update((d) => {
      const rest = { ...d };
      delete rest[keyOf(categoryId, itemId)];
      return rest;
    });
  }
}
