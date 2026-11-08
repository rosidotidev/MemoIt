import { describe, expect, it } from 'vitest';
import { mapItemError } from './item-backend';

describe('mapItemError', () => {
  it.each([
    ['unavailable', 'network'],
    ['firestore/deadline-exceeded', 'timeout'],
    ['permission-denied', 'permission'],
    ['invalid-argument', 'invalid'],
    ['not-found', 'notFound'],
    ['firestore/not-found', 'notFound'],
    ['whatever', 'unknown'],
  ])('maps %s to %s', (code, expected) => {
    expect(mapItemError({ code })).toBe(expected);
  });
});
