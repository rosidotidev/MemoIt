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
} from '@angular/core';
import { IconComponent } from './icon.component';

export interface SortOption {
  readonly value: string;
  readonly label: string;
}

/**
 * Modal sheet with one button per sort option: bottom sheet on compact widths, centered otherwise (CSS).
 * Choosing an option emits it; Escape or the scrim emits closed. Traps focus and restores it on destroy.
 */
@Component({
  selector: 'memo-sort-sheet',
  imports: [IconComponent],
  templateUrl: './sort-sheet.component.html',
  styleUrl: './sort-sheet.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class SortSheetComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);

  readonly heading = input.required<string>();
  readonly closeLabel = input.required<string>();
  readonly options = input.required<readonly SortOption[]>();
  readonly selected = input.required<string>();

  readonly chosen = output<string>();
  readonly closed = output<void>();

  constructor() {
    const previous = this.doc.activeElement as HTMLElement | null;
    afterNextRender(() => {
      const target =
        this.host.nativeElement.querySelector<HTMLElement>('[aria-pressed=true]') ??
        this.host.nativeElement.querySelector<HTMLElement>('.option');
      target?.focus();
    });
    inject(DestroyRef).onDestroy(() => previous?.focus());
  }

  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      event.preventDefault();
      event.stopPropagation();
      this.closed.emit();
      return;
    }
    if (event.key !== 'Tab') {
      return;
    }
    const items = [...this.host.nativeElement.querySelectorAll<HTMLElement>('[role=dialog] button:not([disabled])')];
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
