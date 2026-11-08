import type { Item } from './item';

export const ITEM_SORTS = ['newest', 'priority', 'deadline'] as const;
export type ItemSort = (typeof ITEM_SORTS)[number];

export const isItemSort = (v: unknown): v is ItemSort => ITEM_SORTS.includes(v as ItemSort);

const PRIORITY_RANK = { high: 0, medium: 1, low: 2 } as const;

/** Orders open Items by the chosen sort. Input is newest first; the sort is stable, missing values go last. */
export function sortOpenItems(items: readonly Item[], sort: ItemSort): Item[] {
  const list = [...items];
  switch (sort) {
    case 'priority':
      return list.sort((a, b) => PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]);
    case 'deadline':
      return list.sort((a, b) => {
        if (a.deadline === undefined || b.deadline === undefined) {
          return a.deadline === b.deadline ? 0 : a.deadline === undefined ? 1 : -1;
        }
        return a.deadline - b.deadline;
      });
    default:
      return list;
  }
}
