import { TestBed } from '@angular/core/testing';
import { AuthBackend } from './auth-backend';
import { AuthService } from './auth.service';

class FakeBackend extends AuthBackend {
  cb: (uid: string | null, profile?: { email: string; name: string }) => void = () => undefined;
  signInCalls = 0;
  result: Promise<string> = Promise.resolve('u1');
  onChange(cb: (uid: string | null, profile?: { email: string; name: string }) => void) {
    this.cb = cb;
    return () => undefined;
  }
  signIn(): Promise<string> {
    this.signInCalls++;
    return this.result;
  }
  async signOut() {
    this.cb(null);
  }
}

describe('AuthService', () => {
  let backend: FakeBackend;
  let auth: AuthService;

  beforeEach(() => {
    backend = new FakeBackend();
    TestBed.configureTestingModule({ providers: [{ provide: AuthBackend, useValue: backend }] });
    auth = TestBed.inject(AuthService);
  });

  it('starts unknown and follows the backend', () => {
    expect(auth.session().kind).toBe('unknown');
    backend.cb('u9');
    expect(auth.session()).toEqual({ kind: 'signedIn', uid: 'u9' });
    backend.cb(null);
    expect(auth.session().kind).toBe('signedOut');
  });

  it('signs in and sets the session', async () => {
    const r = await auth.signIn('a@b.c', 'pw');
    expect(r).toEqual({ ok: true, uid: 'u1' });
    expect(auth.session()).toEqual({ kind: 'signedIn', uid: 'u1' });
    expect(auth.busy()).toBe(false);
  });

  it.each([
    ['auth/invalid-credential', 'invalid-credentials'],
    ['auth/invalid-email', 'invalid-email'],
    ['auth/network-request-failed', 'network'],
    ['auth/other', 'unknown'],
  ])('maps %s to %s without granting access', async (code, expected) => {
    backend.result = Promise.reject({ code, message: 'raw text' });
    backend.cb(null);
    const r = await auth.signIn('a@b.c', 'pw');
    expect(r).toEqual({ ok: false, error: expected });
    expect(auth.session().kind).toBe('signedOut');
  });

  it('maps a non-object failure to unknown', async () => {
    backend.result = Promise.reject('boom');
    expect(await auth.signIn('a', 'b')).toEqual({ ok: false, error: 'unknown' });
  });

  it('sends one request on a double submit', async () => {
    const p1 = auth.signIn('a@b.c', 'pw');
    expect(auth.busy()).toBe(true);
    const p2 = auth.signIn('a@b.c', 'pw');
    expect(p2).toBe(p1);
    await p1;
    expect(backend.signInCalls).toBe(1);
  });

  it('signs out through the backend', async () => {
    backend.cb('u1');
    await auth.signOut();
    expect(auth.session().kind).toBe('signedOut');
  });

  it('exposes the profile and clears it on sign out', () => {
    backend.cb('u1', { email: 'a@b.c', name: 'Ann' });
    expect(auth.profile()).toEqual({ email: 'a@b.c', name: 'Ann' });
    backend.cb(null);
    expect(auth.profile()).toBeNull();
  });
});
