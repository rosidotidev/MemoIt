import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, inject, signal } from '@angular/core';

export type WindowClass = 'compact' | 'medium' | 'expanded';

export const MEDIUM_MIN = 768;
export const EXPANDED_MIN = 1200;
/** Width from which the Items screen shows the Category list beside the Items (UX-DR6). */
export const TWO_PANE_MIN = 1024;

export function windowClassFor(width: number): WindowClass {
  if (width < MEDIUM_MIN) {
    return 'compact';
  }
  return width < EXPANDED_MIN ? 'medium' : 'expanded';
}

/** The only place that measures the window. */
@Injectable({ providedIn: 'root' })
export class LayoutService {
  private readonly win = inject(DOCUMENT).defaultView;
  private readonly current = signal<WindowClass>(windowClassFor(this.win?.innerWidth ?? 0));
  private readonly wide = signal((this.win?.innerWidth ?? 0) >= TWO_PANE_MIN);
  readonly windowClass = this.current.asReadonly();
  readonly twoPane = this.wide.asReadonly();

  constructor() {
    const win = this.win;
    if (win) {
      const onResize = () => {
        this.current.set(windowClassFor(win.innerWidth));
        this.wide.set(win.innerWidth >= TWO_PANE_MIN);
      };
      win.addEventListener('resize', onResize);
      inject(DestroyRef).onDestroy(() => win.removeEventListener('resize', onResize));
    }
  }
}
