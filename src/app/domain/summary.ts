import type { Item } from './item';
import { isOverdue, nextWeekStart } from './time';

export interface HomeSummary {
  readonly overdue: number;
  readonly open: number;
  /** Open, not overdue, Deadline before the start of next week (Monday). */
  readonly dueThisWeek: number;
  readonly categories: number;
}

/** Counts derived from the loaded Items; nothing is stored (AD-2). */
export function summarize(items: readonly Item[], categoryCount: number, now: number): HomeSummary {
  const end = nextWeekStart(now);
  let overdue = 0;
  let open = 0;
  let dueThisWeek = 0;
  for (const i of items) {
    if (i.done) {
      continue;
    }
    open++;
    if (isOverdue(i, now)) {
      overdue++;
    } else if (i.deadline !== undefined && i.deadline < end) {
      dueThisWeek++;
    }
  }
  return { overdue, open, dueThisWeek, categories: categoryCount };
}

export const DUE_SOON_LIMIT = 10;

/** Open Items with a Deadline, overdue first then soonest (one ascending sort does both). */
export function dueSoon(items: readonly Item[], limit = DUE_SOON_LIMIT): Item[] {
  return items
    .filter((i) => !i.done && i.deadline !== undefined)
    .sort((a, b) => (a.deadline as number) - (b.deadline as number))
    .slice(0, limit);
}
