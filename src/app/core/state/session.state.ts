import { Injectable, signal } from '@angular/core';
import { UNKNOWN_SESSION, type Session } from '../../domain/session';

/** Holder of the tri-state session signal. Written by AuthService only. */
@Injectable({ providedIn: 'root' })
export class SessionState {
  readonly session = signal<Session>(UNKNOWN_SESSION);
  /** Email and display name of the signed-in user (name falls back to the email). Null when signed out. */
  readonly profile = signal<{ readonly email: string; readonly name: string } | null>(null);
}
