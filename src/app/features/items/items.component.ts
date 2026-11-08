import { AccountMenuComponent } from '../../shared/account-menu.component';
import { NgTemplateOutlet } from '@angular/common';
import { ChangeDetectionStrategy, Component, ElementRef, computed, effect, inject, signal, untracked, viewChild } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { map } from 'rxjs';
import { CategoryStore } from '../../core/data/category.store';
import { ClockService } from '../../core/state/clock.service';
import { ItemStore } from '../../core/data/item.store';
import { progress } from '../../domain/category';
import { SessionState } from '../../core/state/session.state';
import { ViewState } from '../../core/state/view-state';
import type { Item } from '../../domain/item';
import { formatDeadline, isOverdue } from '../../domain/time';
import { ITEM_FILTERS, filterItems, type ItemFilter } from '../../domain/item-filter';
import { ITEM_SORTS, isItemSort, sortOpenItems, type ItemSort } from '../../domain/item-sort';
import { IconComponent } from '../../shared/icon.component';
import { SortSheetComponent } from '../../shared/sort-sheet.component';
import { LayoutService } from '../../shared/layout.service';
import { LanguageService } from '../../shared/language.service';
import { SnackbarService } from '../../shared/snackbar.service';

/** Category screen: head card with progress ring, Open and Done sections, empty state and the Add item FAB. */
@Component({
  selector: 'memo-items',
  imports: [AccountMenuComponent, RouterLink, NgTemplateOutlet, SortSheetComponent, IconComponent],
  templateUrl: './items.component.html',
  styleUrl: './items.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(keydown.escape)': 'onEscape()',
    '(document:click)': 'onDocumentClick($event)',
  },
})
export class ItemsComponent {
  private readonly store = inject(CategoryStore);
  protected readonly twoPane = inject(LayoutService).twoPane;
  protected readonly categories = this.store.categories;
  private readonly itemStore = inject(ItemStore);
  private readonly language = inject(LanguageService);
  protected readonly strings = this.language.strings;
  private readonly clock = inject(ClockService);
  private readonly id = toSignal(inject(ActivatedRoute).paramMap.pipe(map((p) => p.get('categoryId') ?? '')), {
    initialValue: '',
  });
  protected readonly category = computed(() => this.store.byId(this.id()));
  protected readonly itemStatus = this.itemStore.status;
  protected readonly circumference = 2 * Math.PI * 24;
  private readonly sorted = computed(() => this.itemStore.forCategory(this.id()));
  private readonly view = inject(ViewState);
  private readonly session = inject(SessionState).session;
  protected readonly query = signal('');
  private readonly chosen = signal<{ readonly key: string; readonly filter: ItemFilter } | null>(null);
  private readonly uid = computed(() => {
    const s = this.session();
    return s.kind === 'signedIn' ? s.uid : '';
  });
  /** Active chip: this visit's choice for the current Category, else the stored one. */
  protected readonly filter = computed<ItemFilter>(() => {
    const key = `${this.uid()}/${this.id()}`;
    const c = this.chosen();
    return c?.key === key ? c.filter : this.view.getFilter(this.uid(), this.id());
  });
  protected readonly chips = computed(() => {
    const s = this.strings().category;
    const labels: Record<ItemFilter, string> = {
      all: s.filterAll,
      overdue: s.filterOverdue,
      high: s.filterHigh,
      deadline: s.filterDeadline,
    };
    return ITEM_FILTERS.map((value) => ({ value, label: labels[value] }));
  });
  private readonly chosenSort = signal<{ readonly key: string; readonly sort: ItemSort } | null>(null);
  /** Active sort: this visit's choice for the current Category, else the stored one. */
  protected readonly sort = computed<ItemSort>(() => {
    const key = `${this.uid()}/${this.id()}`;
    const c = this.chosenSort();
    return c?.key === key ? c.sort : this.view.getSort(this.uid(), this.id());
  });
  protected readonly sortOptions = computed(() => {
    const s = this.strings().category;
    const labels: Record<ItemSort, string> = { newest: s.sortNewest, priority: s.sortPriority, deadline: s.sortDeadline };
    return ITEM_SORTS.map((value) => ({ value, label: labels[value] }));
  });
  protected readonly sortOpen = signal(false);
  private readonly shown = computed(() => filterItems(this.sorted(), this.query(), this.filter(), this.clock.now()));
  protected readonly openItems = computed(() =>
    sortOpenItems(
      this.shown().filter((i) => !i.done),
      this.sort(),
    ),
  );
  protected readonly doneItems = computed(() => this.shown().filter((i) => i.done));
  protected readonly counts = computed(() => this.itemStore.countsFor(this.id()));
  protected readonly percent = computed(() => Math.round(progress(this.counts().done, this.counts().total) * 100));
  protected readonly percentText = computed(() => `${this.percent()}%`);
  protected readonly summary = computed(
    () => `${this.counts().open} ${this.strings().categories.summaryOpen.toLowerCase()} · ${this.counts().done} ${(this.category()?.stateLabel ?? '').toLowerCase()} · ${this.counts().total} ${this.strings().category.inTotal}`,
  );
  /** Open Items of this Category past their Deadline (head card chip). */
  protected readonly overdueCount = computed(
    () => this.sorted().filter((i) => isOverdue(i, this.clock.now())).length,
  );
  protected readonly overdueLabel = computed(() => this.strings().category.filterOverdue.toLowerCase());
  protected readonly menuOpen = signal(false);
  private readonly menuButton = viewChild.required<ElementRef<HTMLButtonElement>>('menuButton');
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  private readonly snackbar = inject(SnackbarService);

  constructor() {
    // Two-pane: the component is reused when the Category changes; search text and the sort sheet are per visit.
    effect(() => {
      this.id();
      untracked(() => {
        this.query.set('');
        this.sortOpen.set(false);
      });
    });
  }

  protected initial(name: string): string {
    return name.trim().charAt(0).toUpperCase();
  }

  /** Open Items of a Category, for the pane badge. */
  protected paneSub(c: { id: string; stateLabel: string; reportable: boolean }): string {
    const open = this.openCount(c.id);
    const base = open > 0 ? `${open} ${this.strings().categories.summaryOpen.toLowerCase()}` : `${this.strings().category.allPrefix} ${c.stateLabel.toLowerCase()}`;
    return c.reportable ? `${base} · ${this.strings().nav.report}` : base;
  }

  protected openCount(categoryId: string): number {
    return this.itemStore.countsFor(categoryId).open;
  }

  /** Open and past its Deadline, as of the clock tick. */
  protected overdue(item: Item): boolean {
    return isOverdue(item, this.clock.now());
  }

  /** Local-time label of an Item's Deadline. */
  protected deadlineText(deadline: number): string {
    return formatDeadline(deadline, this.clock.now(), this.language.language());
  }

  /** Toggles Done, then names the Item in a snackbar with Undo (another toggle); a failure shows the error. */
  protected async toggle(item: Item): Promise<void> {
    const s = this.strings().category;
    const result = await this.itemStore.toggleDone(item.id);
    if (!result.ok) {
      if (!result.ignored) {
        this.snackbar.show(s.toggleError);
      }
      return;
    }
    const text = result.item.done
      ? `${item.title} ${s.markedDone} ${this.category()?.stateLabel ?? ''}`.trim()
      : `${item.title} ${s.reopened}`;
    this.snackbar.show(text, { label: s.undo, run: () => void this.undo(item.id, result.item.done) });
  }

  /** Undo only reverts the toggle it was offered for; a later change to the Item is left alone. */
  private async undo(id: string, toggledTo: boolean): Promise<void> {
    if (this.itemStore.byId(id)?.done !== toggledTo) {
      return;
    }
    const result = await this.itemStore.toggleDone(id);
    if (!result.ok && !result.ignored) {
      this.snackbar.show(this.strings().category.toggleError);
    }
  }

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected selectFilter(filter: ItemFilter): void {
    this.chosen.set({ key: `${this.uid()}/${this.id()}`, filter });
    this.view.setFilter(this.uid(), this.id(), filter);
  }

  protected selectSort(value: string): void {
    if (isItemSort(value)) {
      this.chosenSort.set({ key: `${this.uid()}/${this.id()}`, sort: value });
      this.view.setSort(this.uid(), this.id(), value);
    }
    this.sortOpen.set(false);
  }

  protected retry(): void {
    this.itemStore.reload();
  }

  protected toggleMenu(): void {
    this.menuOpen.update((v) => !v);
  }

  protected closeMenu(): void {
    this.menuOpen.set(false);
  }

  protected onEscape(): void {
    if (this.menuOpen()) {
      this.menuOpen.set(false);
      this.menuButton().nativeElement.focus();
    }
  }

  protected onDocumentClick(event: Event): void {
    if (this.menuOpen() && !this.host.nativeElement.contains(event.target as Node)) {
      this.menuOpen.set(false);
    }
  }
}
