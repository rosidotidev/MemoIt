import { DOCUMENT } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  DestroyRef,
  ElementRef,
  afterNextRender,
  inject,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { CategoryStore } from '../../core/data/category.store';
import { NAME_MAX, validateName, type AddError } from '../../domain/category';
import { LanguageService } from '../../shared/language.service';

const FOCUSABLE = 'button:not([disabled]), input:not([disabled])';

/** Hand-built modal dialog: traps focus, closes on Escape, restores focus on destroy. */
@Component({
  selector: 'memo-new-category-dialog',
  templateUrl: './new-category-dialog.component.html',
  styleUrl: './new-category-dialog.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewCategoryDialogComponent {
  private readonly store = inject(CategoryStore);
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly doc = inject(DOCUMENT);
  protected readonly strings = inject(LanguageService).strings;
  protected readonly nameMax = NAME_MAX;
  private readonly input = viewChild.required<ElementRef<HTMLInputElement>>('nameInput');

  readonly closed = output<void>();

  protected readonly name = signal('');
  protected readonly error = signal<AddError | null>(null);
  protected readonly busy = signal(false);
  protected readonly reportable = signal(false);

  constructor() {
    const previous = this.doc.activeElement as HTMLElement | null;
    afterNextRender(() => this.input().nativeElement.focus());
    inject(DestroyRef).onDestroy(() => previous?.focus());
  }

  protected onInput(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
    this.error.set(null);
  }

  protected cancel(): void {
    if (!this.busy()) {
      this.closed.emit();
    }
  }

  protected async submit(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.busy()) {
      return;
    }
    const invalid = validateName(this.name(), this.store.categories());
    if (invalid) {
      this.error.set(invalid);
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const result = await this.store.add(this.name(), this.reportable());
    this.busy.set(false);
    if (result.ok) {
      this.closed.emit();
    } else {
      this.error.set(result.error);
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
    const items = [...this.host.nativeElement.querySelectorAll<HTMLElement>(`[role=dialog] :is(${FOCUSABLE})`)];
    if (items.length === 0) {
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
