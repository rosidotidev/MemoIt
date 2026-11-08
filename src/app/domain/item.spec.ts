import { countItems, initialDraft, sortItems, type Item } from './item';
import { DESCRIPTION_MAX, TITLE_MAX, validateDescription, validateTitle } from './validation';

const item = (id: string, createdAt: number, done = false, extra: Partial<Item> = {}): Item => ({
  id,
  categoryId: 'k',
  title: id,
  done,
  priority: 'medium',
  createdAt,
  ...extra,
});

describe('item domain', () => {
  it('builds an empty draft, or one from an Item', () => {
    expect(initialDraft('k')).toEqual({ categoryId: 'k', title: '', description: '', priority: 'medium', deadline: null, value: '' });
    expect(initialDraft('k', item('a', 1, false, { description: 'd' }))).toEqual({
      categoryId: 'k',
      itemId: 'a',
      title: 'a',
      description: 'd',
      priority: 'medium',
      deadline: null,
      value: '',
    });
  });

  it('carries a Value into the draft as text, empty when absent', () => {
    expect(initialDraft('c').value).toBe('');
    expect(initialDraft('c', item('a', 1, false, { value: 82.4 })).value).toBe('82.4');
  });

  it('carries priority and deadline from an Item into the draft', () => {
    const d = initialDraft('k', item('a', 1, false, { priority: 'high', deadline: 9000 }));
    expect(d.priority).toBe('high');
    expect(d.deadline).toBe(9000);
  });

  it('sorts Open newest first and Done after them', () => {
    const sorted = sortItems([item('a', 1), item('d', 9, true), item('b', 3), item('c', 2, true)]);
    expect(sorted.map((i) => i.id)).toEqual(['b', 'a', 'd', 'c']);
  });

  it('counts total, open and done', () => {
    expect(countItems([item('a', 1), item('b', 2, true)])).toEqual({ total: 2, open: 1, done: 1 });
    expect(countItems([])).toEqual({ total: 0, open: 0, done: 0 });
  });
});

describe('item validation', () => {
  it('rejects an empty or blank title and trims before counting', () => {
    expect(validateTitle('')).toBe('empty');
    expect(validateTitle('   ')).toBe('empty');
    expect(validateTitle('  Milk ')).toBeNull();
    expect(validateTitle(` ${'a'.repeat(TITLE_MAX)} `)).toBeNull();
    expect(validateTitle('a'.repeat(TITLE_MAX + 1))).toBe('titleTooLong');
  });

  it('counts code points, not UTF-16 units', () => {
    expect(validateTitle('😀'.repeat(TITLE_MAX))).toBeNull();
    expect(validateTitle('😀'.repeat(TITLE_MAX + 1))).toBe('titleTooLong');
  });

  it('limits the description to 4000', () => {
    expect(validateDescription('')).toBeNull();
    expect(validateDescription('a'.repeat(DESCRIPTION_MAX))).toBeNull();
    expect(validateDescription('a'.repeat(DESCRIPTION_MAX + 1))).toBe('descriptionTooLong');
  });
});
