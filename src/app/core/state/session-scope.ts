import { effect, Injectable, inject, signal, untracked } from '@angular/core';
import { SessionState } from './session.state';

/**
 * Increments `sessionEpoch` whenever the signed-in identity changes
 * (signedOut -> A, A -> signedOut, A -> B) and runs registered resets.
 * The initial restore (`unknown`) is not a change.
 */
@Injectable({ providedIn: 'root' })
export class SessionScope {
  private readonly state = inject(SessionState);
  private readonly resets = new Set<() => void>();
  private lastUid: string | null | undefined = undefined;
  private readonly epoch = signal(0);
  readonly sessionEpoch = this.epoch.asReadonly();

  constructor() {
    effect(() => {
      const s = this.state.session();
      if (s.kind === 'unknown') {
        return;
      }
      const uid = s.kind === 'signedIn' ? s.uid : null;
      untracked(() => {
        if (this.lastUid === undefined) {
          this.lastUid = uid; // first settled state (restore) is not a change
          return;
        }
        if (uid === this.lastUid) {
          return;
        }
        this.lastUid = uid;
        this.epoch.update((e) => e + 1);
        for (const reset of [...this.resets]) {
          try {
            reset();
          } catch (e) {
            console.error(e);
          }
        }
      });
    });
  }

  /** Registers a reset to run on every session change. Returns an unregister function. */
  registerReset(fn: () => void): () => void {
    this.resets.add(fn);
    return () => this.resets.delete(fn);
  }

  /** True when a result captured at `epoch` still belongs to the current session. */
  isCurrent(epoch: number): boolean {
    return epoch === this.epoch();
  }
}
