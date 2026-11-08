import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { CategoryStore } from '../../core/data/category.store';
import { ItemStore } from '../../core/data/item.store';
import { ClockService } from '../../core/state/clock.service';
import { progress } from '../../domain/category';
import { dueSoon, summarize } from '../../domain/summary';
import { formatDeadline, hourOf, isOverdue } from '../../domain/time';
import { LanguageService } from '../../shared/language.service';
import { AuthService } from '../../core/data/auth.service';
import { AccountMenuComponent } from '../../shared/account-menu.component';
import { IconComponent } from '../../shared/icon.component';
import { NewCategoryDialogComponent } from './new-category-dialog.component';

@Component({
  selector: 'memo-categories',
  imports: [RouterLink, NewCategoryDialogComponent, AccountMenuComponent, IconComponent],
  templateUrl: './categories.component.html',
  styleUrl: './categories.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class CategoriesComponent {
  private readonly store = inject(CategoryStore);
  private readonly items = inject(ItemStore);
  private readonly clock = inject(ClockService);
  private readonly language = inject(LanguageService);
  private readonly profile = inject(AuthService).profile;
  protected readonly strings = this.language.strings;
  protected readonly today = computed(() =>
    new Intl.DateTimeFormat(this.language.language(), { weekday: 'long', day: 'numeric', month: 'long' }).format(
      this.clock.now(),
    ),
  );
  protected readonly greeting = computed(() => {
    const t = this.strings().categories;
    const h = hourOf(this.clock.now());
    const tpl = h < 12 ? t.greetingMorning : h < 18 ? t.greetingAfternoon : t.greetingEvening;
    const full = (this.profile()?.name ?? '').trim().split('@')[0].split(/\s+/)[0];
    return tpl.replace('{name}', full).replace(/,\s*$/, '');
  });
  protected readonly countLabel = computed(() => {
    const t = this.strings().categories;
    const n = this.cards().length;
    return (n === 1 ? t.categoryCountOne : t.categoryCountMany).replace('{n}', String(n));
  });
  protected sub(c: { open: number; done: number; total: number }): string {
    const t = this.strings().categories;
    return c.open > 0 ? t.openCount.replace('{n}', String(c.open)) : t.allDone;
  }
  protected doneOf(c: { done: number; total: number }): string {
    return this.strings().categories.doneOf.replace('{done}', String(c.done)).replace('{total}', String(c.total));
  }
  protected readonly status = this.store.status;
  protected readonly query = signal('');
  protected readonly dialogOpen = signal(false);

  protected readonly hasAny = computed(() => this.store.categories().length > 0);
  /** Cards with progress derived from the loaded Items. */
  protected readonly cards = computed(() => {
    const q = this.query().trim().toLowerCase();
    const now = this.clock.now();
    return this.store
      .categories()
      .filter((c) => q === '' || c.name.toLowerCase().includes(q))
      .map((c) => {
        const n = this.items.countsFor(c.id);
        const late = this.items.items().some((i) => i.categoryId === c.id && isOverdue(i, now));
        return {
          ...c,
          open: n.open,
          done: n.done,
          total: n.total,
          late,
          percent: Math.round(progress(n.done, n.total) * 100),
        };
      });
  });
  /** Only Items of a loaded Category count, like the Due soon strip; hidden until Items are ready. */
  protected readonly summary = computed(() => {
    const ids = new Set(this.store.categories().map((c) => c.id));
    return summarize(
      this.items.items().filter((i) => ids.has(i.categoryId)),
      ids.size,
      this.clock.now(),
    );
  });
  protected readonly itemsReady = computed(() => this.items.status() === 'ready');
  /** Due soon strip: only Items of a Category that is still loaded. */
  protected readonly strip = computed(() => {
    const names = new Map(this.store.categories().map((c) => [c.id, c.name]));
    const now = this.clock.now();
    const locale = this.language.language();
    return dueSoon(this.items.items().filter((i) => names.has(i.categoryId))).map((i) => ({
      id: i.id,
      categoryId: i.categoryId,
      title: i.title,
      category: names.get(i.categoryId) ?? '',
      overdue: isOverdue(i, now),
      high: i.priority === 'high',
      when: formatDeadline(i.deadline as number, now, locale),
    }));
  });

  protected onSearch(event: Event): void {
    this.query.set((event.target as HTMLInputElement).value);
  }

  protected retry(): void {
    this.store.reload();
  }

  protected openDialog(): void {
    this.dialogOpen.set(true);
  }

  protected closeDialog(): void {
    this.dialogOpen.set(false);
  }
}
