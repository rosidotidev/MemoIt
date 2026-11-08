import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';
import { epochNow } from '../../domain/time';

export const CLOCK_TICK_MS = 30_000;

/** `now` in epoch milliseconds, refreshed every 30 s and when the tab becomes visible again (AD-4). */
@Injectable({ providedIn: 'root' })
export class ClockService {
  private readonly nowSignal = signal(epochNow());
  readonly now = this.nowSignal.asReadonly();

  constructor() {
    const doc = inject(DOCUMENT);
    const timer = setInterval(() => this.refresh(), CLOCK_TICK_MS);
    const onVisible = () => {
      if (doc.visibilityState === 'visible') {
        this.refresh();
      }
    };
    doc.addEventListener('visibilitychange', onVisible);
    inject(DestroyRef).onDestroy(() => {
      clearInterval(timer);
      doc.removeEventListener('visibilitychange', onVisible);
    });
  }

  refresh(): void {
    this.nowSignal.set(epochNow());
  }
}
