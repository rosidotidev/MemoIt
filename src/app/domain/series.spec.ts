import type { Item } from './item';
import { buildSeries, isAggregation, isPeriod } from './series';

const at = (y: number, m: number, d: number, h = 12) => new Date(y, m - 1, d, h).getTime();
const item = (id: string, value: number | undefined, extra: Partial<Item> = {}): Item => ({
  id,
  categoryId: 'c',
  title: id,
  done: false,
  priority: 'medium',
  createdAt: at(2026, 1, 1),
  ...(value === undefined ? {} : { value }),
  ...extra,
});
const NOW = at(2026, 11, 7);

describe('buildSeries', () => {
  it('is empty without Values', () => {
    expect(buildSeries([item('a', undefined)], 'all', 'week', NOW)).toEqual({ buckets: [], summary: null });
  });

  it('ignores Values dated more than a year ahead', () => {
    const s = buildSeries([item('a', 1, { deadline: at(9999, 1, 1) }), item('b', 2, { createdAt: at(2026, 11, 5) })], 'all', 'week', NOW);
    expect(s.buckets.length).toBe(1);
    expect(s.summary?.latest).toBe(2);
  });

  it('places an Item at its Deadline, else createdAt', () => {
    const s = buildSeries(
      [item('a', 1, { deadline: at(2026, 11, 4), createdAt: at(2026, 3, 1) }), item('b', 2, { createdAt: at(2026, 11, 5) })],
      'all',
      'month',
      NOW,
    );
    expect(s.buckets).toEqual([{ start: at(2026, 11, 1, 0), value: 3 }]);
  });

  it('starts weeks on Monday and sums a bucket', () => {
    // 2026-11-02 is a Monday; Sunday 11-08 still belongs to it.
    const s = buildSeries(
      [item('a', 1.1, { createdAt: at(2026, 11, 2, 0) }), item('b', 2.2, { createdAt: at(2026, 11, 8, 23) })],
      'all',
      'week',
      NOW,
    );
    expect(s.buckets).toEqual([{ start: at(2026, 11, 2, 0), value: 3.3 }]);
  });

  it('keeps a bucket with no Values as a gap, never 0', () => {
    const s = buildSeries(
      [item('a', 10, { createdAt: at(2026, 9, 10) }), item('b', 20, { createdAt: at(2026, 11, 10) })],
      'all',
      'month',
      NOW,
    );
    expect(s.buckets.map((b) => b.value)).toEqual([10, null, 20]);
  });

  it('applies the period filter before bucketing', () => {
    const items = [item('old', 100, { createdAt: at(2026, 1, 15) }), item('new', 5, { createdAt: at(2026, 10, 15) })];
    expect(buildSeries(items, '3m', 'month', NOW).summary).toEqual({ latest: 5, change: 0, average: 5, lowest: 5 });
    expect(buildSeries(items, '1y', 'month', NOW).buckets.length).toBe(10);
    expect(buildSeries(items, 'all', 'month', NOW).buckets.length).toBe(10);
  });

  it('summarizes latest, change, average and lowest without gaps', () => {
    const items = [
      item('a', 80, { createdAt: at(2026, 8, 5) }),
      item('b', 70, { createdAt: at(2026, 10, 5) }),
      item('c', 75, { createdAt: at(2026, 11, 5) }),
    ];
    const s = buildSeries(items, 'all', 'month', NOW);
    expect(s.buckets.map((b) => b.value)).toEqual([80, null, 70, 75]);
    expect(s.summary).toEqual({ latest: 75, change: -5, average: 75, lowest: 70 });
  });

  it('keeps a Value of 0 as a real point', () => {
    const s = buildSeries([item('a', 0)], 'all', 'month', NOW);
    expect(s.summary?.lowest).toBe(0);
    expect(s.buckets[0].value).toBe(0);
  });
});

describe('guards', () => {
  it('recognize stored choices', () => {
    expect(isPeriod('6m')).toBe(true);
    expect(isPeriod('2y')).toBe(false);
    expect(isAggregation('week')).toBe(true);
    expect(isAggregation(null)).toBe(false);
  });
});
