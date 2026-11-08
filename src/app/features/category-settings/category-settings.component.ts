import { AccountMenuComponent } from '../../shared/account-menu.component';
import { ChangeDetectionStrategy, Component, computed, effect, inject, signal, untracked } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CategoryStore } from '../../core/data/category.store';
import { ItemStore } from '../../core/data/item.store';
import {
  NAME_MAX,
  STATE_LABEL_MAX,
  STATE_LABEL_SUGGESTIONS,
  type UpdateError,
} from '../../domain/category';
import { ConfirmDialogComponent } from '../../shared/confirm-dialog.component';
import { IconComponent } from '../../shared/icon.component';
import { LanguageService } from '../../shared/language.service';
import { SnackbarService } from '../../shared/snackbar.service';

/** Category settings: name, Done label, Reportable. Explicit Save; values stay on error. */
@Component({
  selector: 'memo-category-settings',
  imports: [AccountMenuComponent, RouterLink, ConfirmDialogComponent, IconComponent],
  templateUrl: './category-settings.component.html',
  styleUrl: './category-settings.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategorySettingsComponent {
  private readonly store = inject(CategoryStore);
  private readonly router = inject(Router);
  private readonly snackbar = inject(SnackbarService);
  protected readonly strings = inject(LanguageService).strings;
  protected readonly nameMax = NAME_MAX;
  protected readonly labelMax = STATE_LABEL_MAX;
  protected readonly suggestions = STATE_LABEL_SUGGESTIONS;
  private readonly itemStore = inject(ItemStore);

  protected readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('categoryId') ?? '')), {
    initialValue: '',
  });
  protected readonly itemsReady = computed(() => this.itemStore.status() === 'ready');
  protected readonly counts = computed(() => this.itemStore.countsFor(this.id()));

  protected readonly name = signal('');
  protected readonly stateLabel = signal('');
  protected readonly reportable = signal(false);
  protected readonly error = signal<UpdateError | null>(null);
  protected readonly busy = signal(false);
  /** Which danger-zone dialog is open, and whether its action is running. */
  protected readonly confirming = signal<'clear' | 'delete' | null>(null);
  protected readonly working = signal(false);
  /** Name and counts captured when a dialog opens, so the text stays stable while batches run. */
  private readonly snapshot = signal({ name: '', done: 0, total: 0 });
  protected readonly dialogBody = computed(() => {
    const s = this.strings().categorySettings;
    const snap = this.snapshot();
    const clear = this.confirming() === 'clear';
    const values: Record<string, string> = { name: snap.name, count: String(clear ? snap.done : snap.total) };
    return (clear ? s.clearDoneBody : s.deleteCategoryBody).replace(/\{(name|count)\}/g, (_m, k: string) => values[k]);
  });

  /** Which field the current error belongs to. */
  protected readonly nameError = computed(() => {
    const e = this.error();
    return e === 'empty' || e === 'duplicate' || e === 'invalid' ? e : null;
  });
  protected readonly labelError = computed(() => {
    const e = this.error();
    return e === 'labelEmpty' || e === 'labelInvalid' ? e : null;
  });
  protected readonly formError = computed(() => {
    const e = this.error();
    return e !== null && this.nameError() === null && this.labelError() === null ? e : null;
  });
  protected readonly previewLabel = computed(() => this.stateLabel().trim());
  protected readonly initial = computed(() => (this.name().trim().charAt(0) || '?').toUpperCase());
  private readonly previewParts = computed(() => this.strings().categorySettings.previewBody.split('{label}'));
  protected readonly previewPrefix = computed(() => this.previewParts()[0]);
  protected readonly previewSuffix = computed(() => this.previewParts()[1] ?? '');
  protected readonly summary = computed(() => {
    const c = this.counts();
    const values: Record<string, string> = {
      total: String(c.total),
      open: String(c.open),
      done: String(c.done),
      label: this.previewLabel().toLowerCase(),
    };
    return this.strings().categorySettings.headSummary.replace(/\{(total|open|done|label)\}/g, (_m, k: string) => values[k]);
  });

  constructor() {
    // Reloads the form whenever the route id changes (Angular reuses the component for a new param).
    // The route is activated by categoryGuard, so the Categories are loaded and the id is known.
    effect(() => {
      const id = this.id();
      untracked(() => {
        const c = this.store.byId(id);
        if (c) {
          this.name.set(c.name);
          this.stateLabel.set(c.stateLabel);
          this.reportable.set(c.reportable);
          this.error.set(null);
        } else {
          void this.router.navigateByUrl('/categories');
        }
      });
    });
  }

  protected onName(event: Event): void {
    this.name.set((event.target as HTMLInputElement).value);
    this.error.set(null);
  }

  protected onLabel(event: Event): void {
    this.stateLabel.set((event.target as HTMLInputElement).value);
    this.error.set(null);
  }

  protected pick(label: string): void {
    this.stateLabel.set(label);
    this.error.set(null);
  }

  protected toggleReportable(): void {
    this.reportable.update((v) => !v);
  }

  protected async save(event?: Event): Promise<void> {
    event?.preventDefault();
    if (this.busy() || this.working()) {
      return;
    }
    this.busy.set(true);
    this.error.set(null);
    const result = await this.store.update(this.id(), {
      name: this.name(),
      stateLabel: this.stateLabel(),
      reportable: this.reportable(),
    });
    this.busy.set(false);
    if (result.ok) {
      this.name.set(result.category.name);
      this.stateLabel.set(result.category.stateLabel);
      this.reportable.set(result.category.reportable);
      this.snackbar.show(this.strings().categorySettings.saved);
    } else {
      this.error.set(result.error);
    }
  }

  protected ask(kind: 'clear' | 'delete'): void {
    if (this.busy() || this.working() || this.itemStore.status() !== 'ready') {
      return;
    }
    const c = this.counts();
    if (kind === 'clear' && c.done === 0) {
      return;
    }
    this.snapshot.set({ name: this.store.byId(this.id())?.name ?? '', done: c.done, total: c.total });
    this.confirming.set(kind);
  }

  protected cancelDialog(): void {
    if (!this.working()) {
      this.confirming.set(null);
    }
  }

  /** Runs the confirmed danger-zone action. Failures show the inline form error; the User stays here. */
  protected async confirmDialog(): Promise<void> {
    const kind = this.confirming();
    if (!kind || this.working()) {
      return;
    }
    this.working.set(true);
    this.error.set(null);
    const id = this.id();
    const result = kind === 'clear' ? await this.itemStore.removeDone(id) : await this.store.remove(id);
    this.working.set(false);
    this.confirming.set(null);
    if (!result.ok) {
      this.error.set(result.error);
    } else if (kind === 'clear') {
      this.snackbar.show(this.strings().categorySettings.cleared);
    } else {
      await this.router.navigateByUrl('/categories');
    }
  }
}
