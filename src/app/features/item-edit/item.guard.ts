import { inject } from '@angular/core';
import { toObservable } from '@angular/core/rxjs-interop';
import { Router, type CanActivateFn } from '@angular/router';
import { filter, map, take } from 'rxjs';
import { ItemStore } from '../../core/data/item.store';

/** Waits for the Items to load, then redirects an unknown Item id to its Category. Runs after categoryGuard. */
export const itemGuard: CanActivateFn = (route) => {
  const store = inject(ItemStore);
  const router = inject(Router);
  const categoryId = route.paramMap.get('categoryId') ?? '';
  const itemId = route.paramMap.get('itemId') ?? '';
  return toObservable(store.status).pipe(
    filter((s) => s !== 'loading'),
    take(1),
    map(() => (store.byId(itemId)?.categoryId === categoryId ? true : router.createUrlTree(['/c', categoryId]))),
  );
};
