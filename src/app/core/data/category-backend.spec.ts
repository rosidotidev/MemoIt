import { fromDoc, mapFirestoreError, toDoc, toUpdateDoc } from './category-backend';

describe('category backend mapping', () => {
  it('maps Firestore codes', () => {
    expect(mapFirestoreError({ code: 'unavailable' })).toBe('network');
    expect(mapFirestoreError({ code: 'firestore/deadline-exceeded' })).toBe('timeout');
    expect(mapFirestoreError({ code: 'permission-denied' })).toBe('permission');
    expect(mapFirestoreError({ code: 'invalid-argument' })).toBe('invalid');
    expect(mapFirestoreError({ code: 'not-found' })).toBe('notFound');
    expect(mapFirestoreError({ code: 'weird' })).toBe('unknown');
    expect(mapFirestoreError(new Error('x'))).toBe('unknown');
  });

  it('builds a document with exactly the stored fields', () => {
    const d = toDoc({ name: 'Books', stateLabel: 'Done', reportable: false });
    expect(Object.keys(d).sort()).toEqual(['createdAt', 'name', 'reportable', 'stateLabel', 'updatedAt']);
    expect(d['name']).toBe('Books');
    expect(d['reportable']).toBe(false);
  });

  it('builds an update with the changed fields only (no createdAt)', () => {
    const d = toUpdateDoc({ name: 'Books', stateLabel: 'Read', reportable: true });
    expect(Object.keys(d).sort()).toEqual(['name', 'reportable', 'stateLabel', 'updatedAt']);
    expect(d['stateLabel']).toBe('Read');
  });

  it('reads a document with defaults for absent fields', () => {
    expect(fromDoc('a', { name: 'Books', stateLabel: 'Read', reportable: true })).toEqual({
      id: 'a',
      name: 'Books',
      stateLabel: 'Read',
      reportable: true,
    });
    expect(fromDoc('b', {})).toEqual({ id: 'b', name: '', stateLabel: 'Done', reportable: false });
  });
});
