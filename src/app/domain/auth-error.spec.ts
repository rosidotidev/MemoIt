import { mapAuthError } from './auth-error';

describe('mapAuthError', () => {
  it.each([
    ['auth/invalid-credential', 'invalid-credentials'],
    ['auth/wrong-password', 'invalid-credentials'],
    ['auth/user-not-found', 'invalid-credentials'],
    ['auth/invalid-email', 'invalid-email'],
    ['auth/network-request-failed', 'network'],
    ['auth/too-many-requests', 'unknown'],
    ['', 'unknown'],
  ])('maps %s to %s', (code, expected) => {
    expect(mapAuthError(code)).toBe(expected);
  });
});
