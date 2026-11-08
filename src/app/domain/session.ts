export type Session =
  | { readonly kind: 'unknown' }
  | { readonly kind: 'signedOut' }
  | { readonly kind: 'signedIn'; readonly uid: string };

export type AuthErrorCode = 'invalid-credentials' | 'invalid-email' | 'network' | 'unknown';

export type AuthResult =
  | { readonly ok: true; readonly uid: string }
  | { readonly ok: false; readonly error: AuthErrorCode };

export const UNKNOWN_SESSION: Session = { kind: 'unknown' };
export const SIGNED_OUT_SESSION: Session = { kind: 'signedOut' };
export const signedIn = (uid: string): Session => ({ kind: 'signedIn', uid });
