import { Injectable, signal } from '@angular/core';

export const SNACKBAR_MS = 5000;

export interface SnackbarAction {
  readonly label: string;
  readonly run: () => void;
}

/** One snackbar at a time: a new message replaces the old one. */
@Injectable({ providedIn: 'root' })
export class SnackbarService {
  private readonly text = signal('');
  private readonly actionSignal = signal<SnackbarAction | null>(null);
  private timer: ReturnType<typeof setTimeout> | null = null;
  readonly message = this.text.asReadonly();
  readonly action = this.actionSignal.asReadonly();

  show(text: string, action?: SnackbarAction): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
    }
    this.text.set(text);
    this.actionSignal.set(action ?? null);
    this.timer = setTimeout(() => {
      this.timer = null;
      this.text.set('');
      this.actionSignal.set(null);
    }, SNACKBAR_MS);
  }

  /** Closes the snackbar, then runs its action. */
  runAction(): void {
    const action = this.actionSignal();
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    this.text.set('');
    this.actionSignal.set(null);
    action?.run();
  }
}
