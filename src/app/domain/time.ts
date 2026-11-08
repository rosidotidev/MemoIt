/**
 * The only domain file that builds or reads dates (AD-4, AD-15b). Everything works on epoch milliseconds in the
 * device's local time; callers pass `now` in, so tests use a fake clock.
 */

export const MINUTE_MS = 60_000;
export const HOUR_MS = 60 * MINUTE_MS;
export const DAY_MS = 24 * HOUR_MS;

/** Minimal shape the time rules need. */
export interface Timed {
  readonly done: boolean;
  readonly deadline?: number;
}

/** Current time in epoch milliseconds. Prefer ClockService in the UI. */
export function epochNow(): number {
  return Date.now();
}

/** Open and past its Deadline. Done Items are never overdue; a Deadline equal to now is not yet overdue. */
/** Local hour of the day (0-23) of an instant. */
export function hourOf(ms: number): number {
  return new Date(ms).getHours();
}

export function isOverdue(item: Timed, now: number): boolean {
  return !item.done && item.deadline !== undefined && item.deadline < now;
}

/** The Deadline falls on the same local calendar day as `now`. */
export function isDueToday(deadline: number, now: number): boolean {
  const a = new Date(deadline);
  const b = new Date(now);
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

/** The Deadline is not past and falls within `ms` from now (inclusive). */
export function isDueWithin(deadline: number, now: number, ms: number): boolean {
  return deadline >= now && deadline <= now + ms;
}

/** Start of the local week (Monday 00:00) containing `now`. */
export function weekStart(now: number): number {
  const d = new Date(now);
  const sinceMonday = (d.getDay() + 6) % 7;
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() - sinceMonday).getTime();
}

/** Start of the next local week (Monday 00:00 after `now`'s week). */
export function nextWeekStart(now: number): number {
  const d = new Date(weekStart(now));
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7).getTime();
}

/** Start of the local month (day 1, 00:00) containing `now`. */
export function monthStart(now: number): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

export type DeadlineQuick = 'today' | 'tomorrow' | 'nextWeek';

/** End of the local day (23:59), `days` days after `now`'s day. */
function endOfDay(now: number, days: number): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), d.getDate() + days, 23, 59).getTime();
}

/** Deadline for a quick chip: end of today, end of tomorrow, or end of the day one week from today. */
export function quickDeadline(kind: DeadlineQuick, now: number): number {
  return endOfDay(now, kind === 'today' ? 0 : kind === 'tomorrow' ? 1 : 7);
}

/** The quick chip whose Deadline equals `deadline`, if any. */
export function matchQuick(deadline: number | null, now: number): DeadlineQuick | null {
  if (deadline === null) {
    return null;
  }
  const kinds: DeadlineQuick[] = ['today', 'tomorrow', 'nextWeek'];
  return kinds.find((k) => quickDeadline(k, now) === deadline) ?? null;
}

const pad = (n: number) => String(n).padStart(2, '0');

/** Value for an `<input type="datetime-local">` in local time. */
export function toInputValue(ms: number): string {
  const d = new Date(ms);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

/** Parses a datetime-local value as local time; null when empty or invalid. */
export function fromInputValue(value: string): number | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) {
    return null;
  }
  const t = new Date(value).getTime();
  // Before 1970 is never a real Deadline and keeps Timestamp.fromMillis from throwing.
  return Number.isNaN(t) || t < 0 ? null : t;
}

/** Local-time label such as "Nov 8, 6:30 PM"; includes the year when it differs from `now`'s. */
export function formatDeadline(deadline: number, now: number, locale: string): string {
  const sameYear = new Date(deadline).getFullYear() === new Date(now).getFullYear();
  return new Intl.DateTimeFormat(locale, {
    ...(sameYear ? {} : { year: 'numeric' }),
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(deadline);
}

/** Local midnight `months` calendar months before the day of `now` (clamped to the end of a shorter month). */
export function monthsAgo(now: number, months: number): number {
  const d = new Date(now);
  const target = new Date(d.getFullYear(), d.getMonth() - months, 1);
  const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
  return new Date(target.getFullYear(), target.getMonth(), Math.min(d.getDate(), last)).getTime();
}

export type BucketKind = 'week' | 'month';

/** Start of the local week (Monday) or calendar month containing `ms`. */
export function bucketStart(ms: number, kind: BucketKind): number {
  return kind === 'week' ? weekStart(ms) : monthStart(ms);
}

/** Start of the bucket after the one starting at `start`. */
export function nextBucketStart(start: number, kind: BucketKind): number {
  const d = new Date(start);
  return kind === 'week'
    ? new Date(d.getFullYear(), d.getMonth(), d.getDate() + 7).getTime()
    : new Date(d.getFullYear(), d.getMonth() + 1, 1).getTime();
}

/** Short local label for a bucket: "Nov 3" for a week, "Nov 2026" for a month. */
export function formatBucket(start: number, kind: BucketKind, locale: string): string {
  return new Intl.DateTimeFormat(
    locale,
    kind === 'week' ? { month: 'short', day: 'numeric' } : { month: 'short', year: 'numeric' },
  ).format(start);
}
