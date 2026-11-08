import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, type CanActivateFn } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { CategoryStore } from '../../core/data/category.store';

/** Waits for the Categories to load, then redirects an unknown id to /categories. */
export const categoryGuard: CanActivateFn = (route) => {
  const store = inject(CategoryStore);
  const router = inject(Router);
  const id = route.paramMap.get('categoryId') ?? '';
  return toObservable(store.status).pipe(
    filter((s) => s !== 'loading'),
    take(1),
    map(() => (store.byId(id) ? true : router.createUrlTree(['/categories']))),
  );
};
