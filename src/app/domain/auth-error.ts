import type { AuthErrorCode } from './session';

/** Maps a backend error code to a safe UI error code. Raw backend text is never shown. */
export function mapAuthError(code: string): AuthErrorCode {
  switch (code) {
    case 'auth/invalid-credential':
    case 'auth/wrong-password':
    case 'auth/user-not-found':
      return 'invalid-credentials';
    case 'auth/invalid-email':
      return 'invalid-email';
    case 'auth/network-request-failed':
      return 'network';
    default:
      return 'unknown';
  }
}
