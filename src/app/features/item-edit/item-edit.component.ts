import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { map } from 'rxjs';
import { CategoryStore } from '../../core/data/category.store';
import { ItemStore } from '../../core/data/item.store';
import { DraftStore } from '../../core/state/draft.store';
import type { ItemError, Priority } from '../../domain/item';
import { validateDescription, validateTitle, validateValue, valueFromText } from '../../domain/validation';
import { ItemFormComponent } from '../../shared/item-form.component';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { LanguageService } from '../../shared/language.service';

/** Page at /c/:categoryId/i/:itemId. Starts from the stored values; the draft keeps typed text after a failed save. */
@Component({
  selector: 'memo-item-edit',
  imports: [ItemFormComponent, ConfirmDialogComponent],
  templateUrl: './item-edit.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemEditComponent {
  private readonly items = inject(ItemStore);
  private readonly categories = inject(CategoryStore);
  private readonly drafts = inject(DraftStore);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);
  protected readonly strings = this.language.strings;
  private readonly params = toSignal(
    inject(ActivatedRoute).paramMap.pipe(map((p) => ({ cat: p.get('categoryId') ?? '', item: p.get('itemId') ?? '' }))),
    { initialValue: { cat: '', item: '' } },
  );
  protected readonly id = computed(() => this.params().cat);
  private readonly itemId = computed(() => this.params().item);

  private readonly stored = computed(() => this.items.byId(this.itemId()));
  protected readonly draft = computed(() => this.drafts.get(this.id(), this.stored()));
  protected readonly categoryName = computed(() => this.categories.byId(this.id())?.name ?? '');
  protected readonly createdText = computed(() => {
    const created = this.stored()?.createdAt;
    return created === undefined
      ? ''
      : new Intl.DateTimeFormat(this.language.language(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }).format(created);
  });
  protected readonly reportable = computed(() => this.categories.byId(this.id())?.reportable === true);
  protected readonly error = signal<ItemError | null>(null);
  protected readonly busy = signal(false);
  protected readonly confirming = signal(false);
  protected readonly deleting = signal(false);
  protected readonly deleteBody = computed(() =>
    this.strings().itemForm.deleteBody.replace('{title}', () => this.stored()?.title ?? ''),
  );

  protected onTitle(title: string): void {
    if (!this.stored()) {
      return;
    }
    this.drafts.set({ ...this.draft(), title });
    this.error.set(null);
  }

  protected onDescription(description: string): void {
    if (!this.stored()) {
      return;
    }
    this.drafts.set({ ...this.draft(), description });
    this.error.set(null);
  }

  protected onPriority(priority: Priority): void {
    if (!this.stored()) {
      return;
    }
    this.drafts.set({ ...this.draft(), priority });
    this.error.set(null);
  }

  protected onDeadline(deadline: number | null): void {
    if (!this.stored()) {
      return;
    }
    this.drafts.set({ ...this.draft(), deadline });
    this.error.set(null);
  }

  protected onValue(value: string): void {
    if (!this.stored()) {
      return;
    }
    this.drafts.set({ ...this.draft(), value });
    this.error.set(null);
  }

  protected async save(): Promise<void> {
    if (this.busy() || this.deleting() || !this.stored()) {
      return;
    }
    const { title, description, priority, deadline, value } = this.draft();
    const reportable = this.reportable();
    const invalid = validateTitle(title) ?? validateDescription(description) ?? (reportable ? validateValue(value) : null);
    if (invalid) {
      this.error.set(invalid);
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const result = await this.items.update(this.itemId(), title, description, {
      priority,
      deadline,
      ...(reportable ? { value: valueFromText(value) } : {}),
    });
    this.busy.set(false);
    if (result.ok) {
      this.drafts.drop(this.id(), this.itemId());
      await this.router.navigate(['/c', this.id()]);
    } else {
      this.error.set(result.error);
    }
  }

  protected cancel(): void {
    if (this.busy()) {
      return;
    }
    this.drafts.drop(this.id(), this.itemId());
    void this.router.navigate(['/c', this.id()]);
  }

  protected askDelete(): void {
    if (this.busy() || this.deleting() || !this.stored()) {
      return;
    }
    this.confirming.set(true);
  }

  protected cancelDelete(): void {
    if (!this.deleting()) {
      this.confirming.set(false);
    }
  }

  protected async confirmDelete(): Promise<void> {
    if (this.deleting() || !this.stored()) {
      return;
    }
    this.deleting.set(true);
    this.error.set(null);
    const result = await this.items.remove(this.itemId());
    this.deleting.set(false);
    this.confirming.set(false);
    if (result.ok) {
      this.drafts.drop(this.id(), this.itemId());
      await this.router.navigate(['/c', this.id()]);
    } else {
      this.error.set(result.error);
    }
  }
}
