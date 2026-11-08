import { TestBed } from '@angular/core/testing';
import { Router, UrlTree, type ActivatedRouteSnapshot, type RouterStateSnapshot } from '@angular/router';
import { firstValueFrom, isObservable, type Observable } from 'rxjs';
import { SIGNED_OUT_SESSION, signedIn } from '../../domain/session';
import { SessionScope } from './session-scope';
import { loginGuard, sessionGuard } from './session.guard';
import { SessionState } from './session.state';

describe('SessionScope', () => {
  let state: SessionState;
  let scope: SessionScope;

  beforeEach(() => {
    state = TestBed.inject(SessionState);
    scope = TestBed.inject(SessionScope);
    TestBed.tick();
  });

  it('does not count the initial restore as a change', () => {
    state.session.set(SIGNED_OUT_SESSION);
    TestBed.tick();
    expect(scope.sessionEpoch()).toBe(0);
  });

  it('does not count a restore straight to signedIn as a change', () => {
    const reset = vi.fn();
    scope.registerReset(reset);
    state.session.set(signedIn('A'));
    TestBed.tick();
    expect(scope.sessionEpoch()).toBe(0);
    expect(reset).not.toHaveBeenCalled();
  });

  it('keeps running resets when one throws', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => undefined);
    const ok = vi.fn();
    scope.registerReset(() => {
      throw new Error('x');
    });
    scope.registerReset(ok);
    state.session.set(SIGNED_OUT_SESSION);
    TestBed.tick();
    state.session.set(signedIn('A'));
    TestBed.tick();
    expect(ok).toHaveBeenCalledTimes(1);
    spy.mockRestore();
  });

  it('increments on out->A, A->out and A->B and runs resets each time', () => {
    const reset = vi.fn();
    scope.registerReset(reset);
    state.session.set(SIGNED_OUT_SESSION);
    TestBed.tick();
    state.session.set(signedIn('A'));
    TestBed.tick();
    expect(scope.sessionEpoch()).toBe(1);
    state.session.set(SIGNED_OUT_SESSION);
    TestBed.tick();
    expect(scope.sessionEpoch()).toBe(2);
    state.session.set(signedIn('A'));
    TestBed.tick();
    state.session.set(signedIn('B'));
    TestBed.tick();
    expect(scope.sessionEpoch()).toBe(4);
    expect(reset).toHaveBeenCalledTimes(4);
  });

  it('rejects stale epochs and stops running unregistered resets', () => {
    const reset = vi.fn();
    const off = scope.registerReset(reset);
    state.session.set(SIGNED_OUT_SESSION);
    TestBed.tick();
    const captured = scope.sessionEpoch();
    state.session.set(signedIn('A'));
    TestBed.tick();
    expect(scope.isCurrent(captured)).toBe(false);
    expect(scope.isCurrent(scope.sessionEpoch())).toBe(true);
    off();
    state.session.set(signedIn('B'));
    TestBed.tick();
    expect(reset).toHaveBeenCalledTimes(1);
  });
});

describe('guards', () => {
  const run = (guard: typeof sessionGuard) =>
    TestBed.runInInjectionContext(() => {
      const r = guard({} as ActivatedRouteSnapshot, {} as RouterStateSnapshot);
      return isObservable(r) ? firstValueFrom(r as Observable<boolean | UrlTree>) : Promise.resolve(r);
    });

  it('waits out unknown, then redirects a signed-out user to /login', async () => {
    const state = TestBed.inject(SessionState);
    let settled = false;
    const p = run(sessionGuard).then((r) => {
      settled = true;
      return r;
    });
    TestBed.tick();
    await Promise.resolve();
    expect(settled).toBe(false);
    state.session.set(SIGNED_OUT_SESSION);
    TestBed.tick();
    const result = await p;
    expect(result).toBeInstanceOf(UrlTree);
    expect(TestBed.inject(Router).serializeUrl(result as UrlTree)).toBe('/login');
  });

  it('lets a signed-in user in and sends them away from /login', async () => {
    TestBed.inject(SessionState).session.set(signedIn('A'));
    TestBed.tick();
    expect(await run(sessionGuard)).toBe(true);
    const r = await run(loginGuard);
    expect(TestBed.inject(Router).serializeUrl(r as UrlTree)).toBe('/categories');
  });

  it('lets a signed-out user see /login', async () => {
    TestBed.inject(SessionState).session.set(SIGNED_OUT_SESSION);
    TestBed.tick();
    expect(await run(loginGuard)).toBe(true);
  });
});
