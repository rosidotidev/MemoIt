import type { Item } from './item';
import { roundValue } from './number';
import { bucketStart, monthsAgo, nextBucketStart, type BucketKind } from './time';

export type Period = '3m' | '6m' | '1y' | 'all';
export const PERIODS: readonly Period[] = ['3m', '6m', '1y', 'all'];
export const AGGREGATIONS: readonly BucketKind[] = ['week', 'month'];

const PERIOD_MONTHS: Record<Exclude<Period, 'all'>, number> = { '3m': 3, '6m': 6, '1y': 12 };

export function isPeriod(v: unknown): v is Period {
  return typeof v === 'string' && (PERIODS as readonly string[]).includes(v);
}

export function isAggregation(v: unknown): v is BucketKind {
  return v === 'week' || v === 'month';
}

/** One bucket on the time axis; `value` is null for a gap (never 0). */
export interface Bucket {
  /** Local start of the week (Monday) or month, in epoch milliseconds. */
  readonly start: number;
  readonly value: number | null;
}

export interface SeriesSummary {
  readonly latest: number;
  /** Latest minus the first bucket with a value. */
  readonly change: number;
  readonly average: number;
  readonly lowest: number;
}

export interface Series {
  /** Continuous from the first to the last bucket with a Value; empty when there are none. */
  readonly buckets: readonly Bucket[];
  /** Null when no bucket has a Value. Gaps are excluded. */
  readonly summary: SeriesSummary | null;
}

/** Where an Item sits on the time axis: its Deadline, else when it was created. */
export function valueTime(item: Pick<Item, 'deadline' | 'createdAt'>): number {
  return item.deadline ?? item.createdAt;
}

/** Sums the Values per week or month after the period filter; buckets between the first and last with no Value are gaps. */
export function buildSeries(items: readonly Item[], period: Period, aggregation: BucketKind, now: number): Series {
  const from = period === 'all' ? -Infinity : monthsAgo(now, PERIOD_MONTHS[period]);
  // Values dated more than a year ahead are ignored: they are plans, and one stray Deadline (year 9999) must not
  // create hundreds of thousands of empty buckets.
  const to = monthsAgo(now, -12);
  const sums = new Map<number, number>();
  for (const item of items) {
    if (item.value === undefined) {
      continue;
    }
    const t = valueTime(item);
    if (t < from || t > to) {
      continue;
    }
    const key = bucketStart(t, aggregation);
    sums.set(key, (sums.get(key) ?? 0) + item.value);
  }
  if (sums.size === 0) {
    return { buckets: [], summary: null };
  }
  const keys = [...sums.keys()].sort((a, b) => a - b);
  const last = keys[keys.length - 1];
  const buckets: Bucket[] = [];
  for (let s = keys[0]; s <= last; s = nextBucketStart(s, aggregation)) {
    const sum = sums.get(s);
    buckets.push({ start: s, value: sum === undefined ? null : roundValue(sum) });
  }
  const values = buckets.flatMap((b) => (b.value === null ? [] : [b.value]));
  const total = values.reduce((a, b) => a + b, 0);
  return {
    buckets,
    summary: {
      latest: values[values.length - 1],
      change: roundValue(values[values.length - 1] - values[0]),
      average: roundValue(total / values.length),
      lowest: Math.min(...values),
    },
  };
}
