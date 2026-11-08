import type { Auth, User } from 'firebase/auth';
import { FirebaseAuthBackend, type UserProfile } from './auth-backend';

/** Fake Auth: the modular onAuthStateChanged delegates to `auth.onAuthStateChanged`. */
function fakeAuth() {
  const fake = {
    next: null as ((u: User | null) => void) | null,
    error: null as ((e: Error) => void) | null,
    onAuthStateChanged(next: (u: User | null) => void, error: (e: Error) => void) {
      fake.next = next;
      fake.error = error;
      return () => undefined;
    },
  };
  return fake;
}

describe('FirebaseAuthBackend.onChange', () => {
  let fake: ReturnType<typeof fakeAuth>;
  let calls: [string | null, UserProfile | undefined][];

  beforeEach(() => {
    fake = fakeAuth();
    calls = [];
    new FirebaseAuthBackend(fake as unknown as Auth).onChange((uid, profile) => calls.push([uid, profile]));
  });

  const user = (o: Partial<User>) => o as User;

  it('maps displayName and email', () => {
    fake.next!(user({ uid: 'u1', email: 'a@b.c', displayName: 'Ann' }));
    expect(calls).toEqual([['u1', { email: 'a@b.c', name: 'Ann' }]]);
  });

  it('falls back to the email when there is no displayName', () => {
    fake.next!(user({ uid: 'u1', email: 'a@b.c', displayName: null }));
    expect(calls).toEqual([['u1', { email: 'a@b.c', name: 'a@b.c' }]]);
  });

  it('falls back to the uid when there is no email either', () => {
    fake.next!(user({ uid: 'u1', email: null, displayName: null }));
    expect(calls).toEqual([['u1', { email: '', name: 'u1' }]]);
  });

  it('reports null for no user and on error', () => {
    fake.next!(null);
    fake.error!(new Error('x'));
    expect(calls).toEqual([
      [null, undefined],
      [null, undefined],
    ]);
  });
});
