import { toInputText } from './number';

export type Priority = 'low' | 'medium' | 'high';

export interface Item {
  readonly id: string;
  readonly categoryId: string;
  readonly title: string;
  /** Absent when empty. */
  readonly description?: string;
  readonly done: boolean;
  readonly priority: Priority;
  /** Deadline in epoch milliseconds; absent when none. */
  readonly deadline?: number;
  /** Numeric Value of an Item in a Reportable Category; absent when none (never null or 0 for "none"). */
  readonly value?: number;
  /** Creation time in epoch milliseconds, used for ordering. */
  readonly createdAt: number;
}

/** What the app supplies for a new Item; the rest is fixed (done false, priority medium, no deadline or value). */
export interface NewItemData {
  readonly categoryId: string;
  readonly title: string;
  readonly description?: string;
  /** Defaults to medium. */
  readonly priority?: Priority;
  readonly deadline?: number;
  readonly value?: number;
}

/** Text being typed in the Item form. */
export interface ItemDraft {
  readonly categoryId: string;
  /** Set when editing an existing Item. */
  readonly itemId?: string;
  readonly title: string;
  readonly description: string;
  readonly priority: Priority;
  /** Epoch milliseconds, or null for no deadline. */
  readonly deadline: number | null;
  /** Value text as typed; empty means none. */
  readonly value: string;
}

export type ItemErrorCode = 'network' | 'timeout' | 'permission' | 'invalid' | 'notFound' | 'unknown';
export type ItemFieldError = 'empty' | 'titleTooLong' | 'descriptionTooLong' | 'valueInvalid';
export type ItemError = ItemErrorCode | ItemFieldError;

export type AddItemResult =
  | { readonly ok: true; readonly item: Item }
  | { readonly ok: false; readonly error: ItemError };

/** What an edit changes: Title and Description (absent when empty), and Priority and Deadline when given. */
export interface ItemEditData {
  readonly title: string;
  readonly description?: string;
  readonly priority?: Priority;
  /** A number sets it, null clears it, undefined leaves it as stored. */
  readonly deadline?: number | null;
  /** A number sets it, null clears it, undefined leaves it as stored. */
  readonly value?: number | null;
}

export interface ItemCounts {
  readonly total: number;
  readonly open: number;
  readonly done: number;
}

/** Draft for the new-Item form, or for editing `item` when given. */
export function initialDraft(categoryId: string, item?: Item): ItemDraft {
  return {
    categoryId,
    ...(item ? { itemId: item.id } : {}),
    title: item?.title ?? '',
    description: item?.description ?? '',
    priority: item?.priority ?? 'medium',
    deadline: item?.deadline ?? null,
    value: item?.value === undefined ? '' : toInputText(item.value),
  };
}

/** Newest first; ties broken by id so the order is stable. */
function byNewest(a: Item, b: Item): number {
  return b.createdAt - a.createdAt || (a.id < b.id ? 1 : a.id > b.id ? -1 : 0);
}

/** Open Items newest first, then Done Items newest first. */
export function sortItems(items: readonly Item[]): Item[] {
  const open = items.filter((i) => !i.done).sort(byNewest);
  const done = items.filter((i) => i.done).sort(byNewest);
  return [...open, ...done];
}

export function countItems(items: readonly Item[]): ItemCounts {
  const done = items.filter((i) => i.done).length;
  return { total: items.length, open: items.length - done, done };
}
