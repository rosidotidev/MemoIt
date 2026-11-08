import { describe, expect, it } from 'vitest';
import type { Item } from './item';
import { isItemSort, sortOpenItems } from './item-sort';

const item = (id: string, priority: Item['priority']): Item => ({ id, categoryId: 'k', title: id, done: false, priority, createdAt: 0 });

describe('sortOpenItems', () => {
  const list = [item('a', 'low'), item('b', 'high'), item('c', 'medium'), item('d', 'high')];

  it('keeps the incoming order for newest', () => {
    expect(sortOpenItems(list, 'newest').map((i) => i.id)).toEqual(['a', 'b', 'c', 'd']);
  });

  it('puts high first and is stable within a priority', () => {
    expect(sortOpenItems(list, 'priority').map((i) => i.id)).toEqual(['b', 'd', 'c', 'a']);
  });

  it('does not mutate the input and validates names', () => {
    const copy = [...list];
    sortOpenItems(list, 'priority');
    expect(list).toEqual(copy);
    expect(isItemSort('priority')).toBe(true);
    expect(isItemSort('x')).toBe(false);
    expect(isItemSort('deadline')).toBe(true);
  });

  it('puts the earliest Deadline first and Items without one last, stably', () => {
    const withDeadline = (id: string, deadline?: number): Item => ({ ...item(id, 'medium'), ...(deadline !== undefined ? { deadline } : {}) });
    const l = [withDeadline('a'), withDeadline('b', 300), withDeadline('c'), withDeadline('d', 100)];
    expect(sortOpenItems(l, 'deadline').map((i) => i.id)).toEqual(['d', 'b', 'a', 'c']);
  });
});
