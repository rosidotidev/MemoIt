import { Injectable } from '@angular/core';
import { isItemFilter, type ItemFilter } from '../../domain/item-filter';
import { isAggregation, isPeriod, type Period } from '../../domain/series';
import type { BucketKind } from '../../domain/time';
import { isItemSort, type ItemSort } from '../../domain/item-sort';

/** Per-device view state in localStorage, keyed by uid and Category. Never sent to Firestore; storage failures are ignored. */
@Injectable({ providedIn: 'root' })
export class ViewState {
  private key(uid: string, categoryId: string, name = 'filter'): string {
    return `memoit.view.${uid}.${categoryId}.${name}`;
  }

  getFilter(uid: string, categoryId: string): ItemFilter {
    try {
      const v = localStorage.getItem(this.key(uid, categoryId));
      return isItemFilter(v) ? v : 'all';
    } catch {
      return 'all';
    }
  }

  setFilter(uid: string, categoryId: string, filter: ItemFilter): void {
    try {
      localStorage.setItem(this.key(uid, categoryId), filter);
    } catch {
      // storage unavailable: the choice just lasts for this visit
    }
  }

  getSort(uid: string, categoryId: string): ItemSort {
    try {
      const v = localStorage.getItem(this.key(uid, categoryId, 'sort'));
      return isItemSort(v) ? v : 'newest';
    } catch {
      return 'newest';
    }
  }

  setSort(uid: string, categoryId: string, sort: ItemSort): void {
    try {
      localStorage.setItem(this.key(uid, categoryId, 'sort'), sort);
    } catch {
      // storage unavailable: the choice just lasts for this visit
    }
  }

  /** Report period and grouping, per device and User. */
  getReport(uid: string): { period: Period; aggregation: BucketKind } {
    try {
      const period = localStorage.getItem(`memoit.view.${uid}.report.period`);
      const aggregation = localStorage.getItem(`memoit.view.${uid}.report.aggregation`);
      return { period: isPeriod(period) ? period : '6m', aggregation: isAggregation(aggregation) ? aggregation : 'month' };
    } catch {
      return { period: '6m', aggregation: 'month' };
    }
  }

  setReport(uid: string, period: Period, aggregation: BucketKind): void {
    try {
      localStorage.setItem(`memoit.view.${uid}.report.period`, period);
      localStorage.setItem(`memoit.view.${uid}.report.aggregation`, aggregation);
    } catch {
      // storage unavailable: the choice just lasts for this visit
    }
  }
}
