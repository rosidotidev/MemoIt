import { DEFAULT_STATE_LABEL, normalizeName, progress, validateName, validateStateLabel, type Category } from './category';

const cat = (name: string): Category => ({ id: name, name, stateLabel: DEFAULT_STATE_LABEL, reportable: false });

describe('category domain', () => {
  it('trims names', () => {
    expect(normalizeName('  Books ')).toBe('Books');
  });

  it('rejects an empty or blank name', () => {
    expect(validateName('', [])).toBe('empty');
    expect(validateName('   ', [])).toBe('empty');
  });

  it('accepts 60 chars and rejects 61', () => {
    expect(validateName('x'.repeat(60), [])).toBeNull();
    expect(validateName('x'.repeat(61), [])).toBe('invalid');
  });

  it('rejects a duplicate case-insensitively, after trimming', () => {
    expect(validateName(' books ', [cat('Books')])).toBe('duplicate');
    expect(validateName('Movies', [cat('Books')])).toBeNull();
  });

  it('ignores the Category being edited when checking duplicates', () => {
    expect(validateName('books', [cat('Books')], 'Books')).toBeNull();
    expect(validateName('books', [cat('Books'), cat('Films')], 'Films')).toBe('duplicate');
  });

  it('validates a State Label (trimmed, 1 to 16)', () => {
    expect(validateStateLabel('  ')).toBe('empty');
    expect(validateStateLabel('x'.repeat(16))).toBeNull();
    expect(validateStateLabel('x'.repeat(17))).toBe('invalid');
    expect(validateStateLabel(' Bought ')).toBeNull();
  });

  it('derives progress', () => {
    expect(progress(0, 0)).toBe(0);
    expect(progress(1, 4)).toBe(0.25);
    expect(progress(5, 4)).toBe(1);
  });
});
