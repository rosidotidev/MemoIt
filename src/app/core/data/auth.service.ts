import { Injectable, inject, signal } from '@angular/core';
import { mapAuthError } from '../../domain/auth-error';
import { SIGNED_OUT_SESSION, signedIn, type AuthResult } from '../../domain/session';
import { SessionState } from '../state/session.state';
import { AuthBackend } from './auth-backend';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly backend = inject(AuthBackend);
  private readonly state = inject(SessionState);
  private pending: Promise<AuthResult> | null = null;

  readonly session = this.state.session.asReadonly();
  readonly profile = this.state.profile.asReadonly();
  readonly busy = signal(false);

  constructor() {
    this.backend.onChange((uid, profile) => {
      this.state.profile.set(uid ? (profile ?? { email: '', name: '' }) : null);
      this.state.session.set(uid ? signedIn(uid) : SIGNED_OUT_SESSION);
    });
  }

  /** Signs in. A second call while one is in flight returns the same promise (one request only). */
  signIn(email: string, password: string): Promise<AuthResult> {
    if (this.pending) {
      return this.pending;
    }
    this.busy.set(true);
    this.pending = Promise.resolve()
      .then(() => this.backend.signIn(email, password))
      .then((uid): AuthResult => {
        this.state.session.set(signedIn(uid));
        return { ok: true, uid };
      })
      .catch((e: unknown): AuthResult => {
        const code = typeof e === 'object' && e !== null && 'code' in e ? String((e as { code: unknown }).code) : '';
        return { ok: false, error: mapAuthError(code) };
      })
      .finally(() => {
        this.pending = null;
        this.busy.set(false);
      });
    return this.pending;
  }

  signOut(): Promise<void> {
    return this.backend.signOut();
  }
}
