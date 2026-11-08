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
import { LanguageService } from '../../shared/language.service';

/** Page at /c/:categoryId/i/new. The draft lives in DraftStore so a failed save keeps the typed text. */
@Component({
  selector: 'memo-item-new',
  imports: [ItemFormComponent],
  templateUrl: './item-new.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemNewComponent {
  private readonly items = inject(ItemStore);
  private readonly categories = inject(CategoryStore);
  private readonly drafts = inject(DraftStore);
  private readonly router = inject(Router);
  private readonly language = inject(LanguageService);
  protected readonly strings = this.language.strings;
  protected readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('categoryId') ?? '')), {
    initialValue: '',
  });

  protected readonly draft = computed(() => this.drafts.get(this.id()));
  protected readonly categoryName = computed(() => this.categories.byId(this.id())?.name ?? '');
  protected readonly reportable = computed(() => this.categories.byId(this.id())?.reportable === true);
  protected readonly error = signal<ItemError | null>(null);
  protected readonly busy = signal(false);

  protected onTitle(title: string): void {
    this.drafts.set({ ...this.draft(), title });
    this.error.set(null);
  }

  protected onDescription(description: string): void {
    this.drafts.set({ ...this.draft(), description });
    this.error.set(null);
  }

  protected onPriority(priority: Priority): void {
    this.drafts.set({ ...this.draft(), priority });
    this.error.set(null);
  }

  protected onDeadline(deadline: number | null): void {
    this.drafts.set({ ...this.draft(), deadline });
    this.error.set(null);
  }

  protected onValue(value: string): void {
    this.drafts.set({ ...this.draft(), value });
    this.error.set(null);
  }

  protected async save(): Promise<void> {
    if (this.busy()) {
      return;
    }
    const id = this.id();
    const { title, description, priority, deadline, value } = this.draft();
    const reportable = this.reportable();
    const invalid = validateTitle(title) ?? validateDescription(description) ?? (reportable ? validateValue(value) : null);
    if (invalid) {
      this.error.set(invalid);
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const result = await this.items.add(id, title, description, {
      priority,
      deadline,
      ...(reportable ? { value: valueFromText(value) } : {}),
    });
    this.busy.set(false);
    if (result.ok) {
      this.drafts.drop(id);
      await this.router.navigate(['/c', id]);
    } else {
      this.error.set(result.error);
    }
  }

  protected cancel(): void {
    if (this.busy()) {
      return;
    }
    const id = this.id();
    this.drafts.drop(id);
    void this.router.navigate(['/c', id]);
  }
}
