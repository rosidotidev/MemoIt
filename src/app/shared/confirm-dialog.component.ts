import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  input,
  output,
  viewChild,
} from '@angular/core';

const FOCUSABLE = 'button:not([disabled])';

/**
 * Reusable modal confirm dialog with a destructive confirm button. Traps focus, closes on Escape, Cancel
 * or the scrim (all ignored while `busy`), and restores focus to the element that had it on destroy.
 */
@Component({
  selector: 'memo-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  styleUrl: './confirm-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ConfirmDialogComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);
  private readonly cancelButton = viewChild.required<ElementRef<HTMLButtonElement>>('cancelButton');

  readonly heading = input.required<string>();
  readonly body = input.required<string>();
  readonly confirmLabel = input.required<string>();
  readonly cancelLabel = input.required<string>();
  readonly busy = input(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  constructor() {
    const previous = this.doc.activeElement as HTMLElement | null;
    afterNextRender(() => this.cancelButton().nativeElement.focus());
    inject(DestroyRef).onDestroy(() => previous?.focus());
  }

  protected cancel(): void {
    if (!this.busy()) {
      this.cancelled.emit();
    }
  }

  protected confirm(): void {
    if (!this.busy()) {
      this.confirmed.emit();
    }
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      this.cancel();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const items = [...this.host.nativeElement.querySelectorAll<HTMLElement>(`[role=dialog] ${FOCUSABLE}`)];
    if (items.length === 0) {
      event.preventDefault();
      return;
    }
    const first = items[0];
    const last = items[items.length - 1];
    const active = this.doc.activeElement;
    if (event.shiftKey && active === first) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }
}
