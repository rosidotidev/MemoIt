import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import type { CanActivateFn } from '@angular/router';
import { Router } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { SessionState } from './session.state';

function settledSession() {
  return toObservable(inject(SessionState).session).pipe(
    filter((s) => s.kind !== 'unknown'),
    take(1),
  );
}

/** Protects a route: waits out `unknown`, redirects to /login when signed out. */
export const sessionGuard: CanActivateFn = () => {
  const router = inject(Router);
  return settledSession().pipe(map((s) => (s.kind === 'signedIn' ? true : router.createUrlTree(['/login']))));
};

/** For /login: redirects to /categories when already signed in. */
export const loginGuard: CanActivateFn = () => {
  const router = inject(Router);
  return settledSession().pipe(map((s) => (s.kind === 'signedIn' ? router.createUrlTree(['/categories']) : true)));
};
