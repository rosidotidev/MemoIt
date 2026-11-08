import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type Auth } from 'firebase/auth';

export interface UserProfile {
  readonly email: string;
  readonly name: string;
}

/** Swappable auth backend. Errors from signIn carry a string `code`. */
export abstract class AuthBackend {
  /** Calls `cb` with the uid (or null) and an optional profile on start and on every change. Returns an unsubscribe function. */
  abstract onChange(cb: (uid: string | null, profile?: UserProfile) => void): () => void;
  abstract signIn(email: string, password: string): Promise<string>;
  abstract signOut(): Promise<void>;
}

/** Firebase Auth backend. Default (local) persistence restores the session after a restart. */
export class FirebaseAuthBackend extends AuthBackend {
  constructor(private readonly auth: Auth) {
    super();
  }

  onChange(cb: (uid: string | null, profile?: UserProfile) => void): () => void {
    return onAuthStateChanged(
      this.auth,
      (user) => {
        if (!user) {
          cb(null);
          return;
        }
        const email = user.email ?? '';
        cb(user.uid, { email, name: user.displayName || email || user.uid });
      },
      () => cb(null),
    );
  }

  async signIn(email: string, password: string): Promise<string> {
    const cred = await signInWithEmailAndPassword(this.auth, email, password);
    return cred.user.uid;
  }

  signOut(): Promise<void> {
    return signOut(this.auth);
  }
}
