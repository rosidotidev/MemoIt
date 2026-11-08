import type { Item } from './item';
import { alertKey, dueAlerts } from './reminder';

const item = (id: string, deadline: number | undefined, done = false): Item => ({
  id,
  categoryId: 'c1',
  title: id,
  done,
  priority: 'medium',
  deadline,
  createdAt: 1,
});

describe('dueAlerts', () => {
  const now = 1_000_000;
  it('returns open Items whose Deadline arrived within the last minute, oldest first', () => {
    const items = [
      item('b', now),
      item('a', now - 59_000),
      item('old', now - 60_000),
      item('future', now + 1),
      item('none', undefined),
    ];
    expect(dueAlerts(items, now).map((i) => i.id)).toEqual(['a', 'b']);
  });
  it('skips Done Items', () => {
    expect(dueAlerts([item('a', now - 1000, true)], now)).toEqual([]);
  });
  it('keys on item id and Deadline', () => {
    expect(alertKey(item('a', 5))).not.toBe(alertKey(item('a', 6)));
  });
});
