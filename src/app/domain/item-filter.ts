import type { Item } from './item';
import { isOverdue } from './time';

export const ITEM_FILTERS = ['all', 'overdue', 'high', 'deadline'] as const;
export type ItemFilter = (typeof ITEM_FILTERS)[number];

export const isItemFilter = (v: unknown): v is ItemFilter => ITEM_FILTERS.includes(v as ItemFilter);

/** Chip predicate; `now` (epoch ms) decides what is overdue. */
export function matchesFilter(item: Item, filter: ItemFilter, now: number): boolean {
  switch (filter) {
    case 'all':
      return true;
    case 'overdue':
      return isOverdue(item, now);
    case 'high':
      return item.priority === 'high';
    case 'deadline':
      return item.deadline !== undefined;
  }
}

/** Case-insensitive match on Title and Description; an empty query matches everything. */
export function matchesQuery(item: Item, query: string): boolean {
  const q = query.trim().toLowerCase();
  return q === '' || item.title.toLowerCase().includes(q) || (item.description ?? '').toLowerCase().includes(q);
}

export function filterItems(items: readonly Item[], query: string, filter: ItemFilter, now: number): Item[] {
  return items.filter((i) => matchesFilter(i, filter, now) && matchesQuery(i, query));
}
