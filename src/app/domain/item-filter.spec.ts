import type { Item } from './item';
import { filterItems, isItemFilter, matchesFilter } from './item-filter';

const item = (over: Partial<Item>): Item => ({
  id: 'a',
  categoryId: 'k',
  title: 'Buy Milk',
  done: false,
  priority: 'medium',
  createdAt: 1,
  ...over,
});

describe('item filter', () => {
  it('Overdue keeps open Items past their Deadline and never Done ones', () => {
    const items = [
      item({ id: '1', deadline: 5 }),
      item({ id: '2', deadline: 20 }),
      item({ id: '3', deadline: 5, done: true }),
      item({ id: '4' }),
    ];
    expect(filterItems(items, '', 'overdue', 10).map((i) => i.id)).toEqual(['1']);
  });

  it('matches the query on title and description, ignoring case', () => {
    const items = [item({ id: '1' }), item({ id: '2', title: 'x', description: 'about MILK' }), item({ id: '3', title: 'Bread' })];
    expect(filterItems(items, ' milk ', 'all', 0).map((i) => i.id)).toEqual(['1', '2']);
    expect(filterItems(items, '', 'all', 0).length).toBe(3);
  });

  it('High priority keeps high items', () => {
    const items = [item({ id: '1', priority: 'high' }), item({ id: '2' })];
    expect(filterItems(items, '', 'high', 0).map((i) => i.id)).toEqual(['1']);
    expect(matchesFilter(items[1], 'high', 0)).toBe(false);
  });

  it('Has deadline keeps Items with a Deadline', () => {
    const items = [item({ id: '1', deadline: 5 }), item({ id: '2' })];
    expect(filterItems(items, '', 'deadline', 0).map((i) => i.id)).toEqual(['1']);
  });

  it('validates stored chip values', () => {
    expect(isItemFilter('high')).toBe(true);
    expect(isItemFilter('deadline')).toBe(true);
    expect(isItemFilter('nope')).toBe(false);
    expect(isItemFilter('overdue')).toBe(true);
  });
});
