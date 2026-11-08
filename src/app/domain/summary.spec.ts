import type { Item } from './item';
import { dueSoon, summarize } from './summary';

const item = (over: Partial<Item>): Item => ({
  id: 'a',
  categoryId: 'k',
  title: 'T',
  done: false,
  priority: 'medium',
  createdAt: 1,
  ...over,
});

// Wednesday 2026-11-11 12:00 local.
const NOW = new Date(2026, 10, 11, 12, 0).getTime();
const at = (day: number, h = 12) => new Date(2026, 10, day, h, 0).getTime();

describe('summary', () => {
  it('counts overdue, open and due this week from the Items, ignoring Done', () => {
    const items = [
      item({ id: '1', deadline: at(10) }), // overdue
      item({ id: '2', deadline: at(13) }), // this week
      item({ id: '3', deadline: at(16) }), // next Monday: not this week
      item({ id: '4' }),
      item({ id: '5', done: true, deadline: at(9) }), // done: never counted
    ];
    expect(summarize(items, 3, NOW)).toEqual({ overdue: 1, open: 4, dueThisWeek: 1, categories: 3 });
  });

  it('a Deadline equal to now is due, not overdue', () => {
    expect(summarize([item({ deadline: NOW })], 1, NOW)).toMatchObject({ overdue: 0, dueThisWeek: 1 });
  });

  it('Due soon lists open Items with a Deadline, soonest first (overdue lead), and is capped', () => {
    const items = [
      item({ id: 'late', deadline: at(20) }),
      item({ id: 'over', deadline: at(1) }),
      item({ id: 'none' }),
      item({ id: 'done', done: true, deadline: at(2) }),
      item({ id: 'soon', deadline: at(12) }),
    ];
    expect(dueSoon(items).map((i) => i.id)).toEqual(['over', 'soon', 'late']);
    expect(dueSoon(items, 2).map((i) => i.id)).toEqual(['over', 'soon']);
  });
});
