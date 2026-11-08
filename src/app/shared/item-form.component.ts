import { AccountMenuComponent } from './account-menu.component';
import { ChangeDetectionStrategy, Component, computed, inject, input, output } from '@angular/core';
import type { ItemError, Priority } from '../domain/item';
import { formatDeadline, fromInputValue, matchQuick, quickDeadline, toInputValue, type DeadlineQuick } from '../domain/time';
import { ClockService } from '../core/state/clock.service';
import { DESCRIPTION_MAX, TITLE_MAX } from '../domain/validation';
import { IconComponent } from './icon.component';
import { LanguageService } from './language.service';

/** Presentational Item form with live preview. The parent owns the values, the save and the errors. */
@Component({
  selector: 'memo-item-form',
  imports: [AccountMenuComponent, IconComponent],
  templateUrl: './item-form.component.html',
  styleUrl: './item-form.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ItemFormComponent {
  private readonly language = inject(LanguageService);
  protected readonly strings = this.language.strings;
  private readonly clock = inject(ClockService);
  protected readonly titleMax = TITLE_MAX;
  protected readonly descriptionMax = DESCRIPTION_MAX;

  /** Appbar title. */
  readonly heading = input('');
  readonly title = input('');
  readonly description = input('');
  readonly priority = input<Priority>('medium');
  /** Epoch milliseconds, or null for no Deadline. */
  readonly deadline = input<number | null>(null);
  /** Show the Value panel (the Category is Reportable). */
  readonly showValue = input(false);
  /** Value text as typed; empty means none. */
  readonly value = input('');
  readonly error = input<ItemError | null>(null);
  readonly busy = input(false);

  readonly titleChange = output<string>();
  readonly descriptionChange = output<string>();
  readonly priorityChange = output<Priority>();
  readonly deadlineChange = output<number | null>();
  readonly valueChange = output<string>();
  readonly saved = output<void>();
  readonly cancelled = output<void>();

  protected readonly titleError = computed(() => {
    const e = this.error();
    return e === 'empty' || e === 'titleTooLong' ? e : null;
  });
  protected readonly descriptionError = computed(() => {
    const e = this.error();
    return e === 'descriptionTooLong' ? e : null;
  });
  protected readonly valueError = computed(() => (this.error() === 'valueInvalid' ? ('valueInvalid' as const) : null));
  protected readonly formError = computed(() => {
    const e = this.error();
    return e !== null && this.titleError() === null && this.descriptionError() === null && this.valueError() === null
      ? e
      : null;
  });
  protected readonly previewTitle = computed(() => this.title().trim());
  protected readonly previewDescription = computed(() => this.description().trim());

  protected readonly priorities = computed<{ value: Priority; key: string; label: string }[]>(() => {
    const s = this.strings().itemForm;
    return [
      { value: 'low', key: 'L', label: s.priorityLow },
      { value: 'medium', key: 'M', label: s.priorityMedium },
      { value: 'high', key: 'H', label: s.priorityHigh },
    ];
  });
  protected readonly quicks = computed<{ value: DeadlineQuick; label: string }[]>(() => {
    const s = this.strings().itemForm;
    return [
      { value: 'today', label: s.deadlineToday },
      { value: 'tomorrow', label: s.deadlineTomorrow },
      { value: 'nextWeek', label: s.deadlineNextWeek },
    ];
  });
  protected readonly activeQuick = computed(() => matchQuick(this.deadline(), this.clock.now()));
  protected readonly deadlineInput = computed(() => {
    const d = this.deadline();
    return d === null ? '' : toInputValue(d);
  });
  protected readonly dateInput = computed(() => this.deadlineInput().slice(0, 10));
  protected readonly timeInput = computed(() => this.deadlineInput().slice(11, 16));
  protected readonly deadlineText = computed(() => {
    const d = this.deadline();
    return d === null ? '' : formatDeadline(d, this.clock.now(), this.language.language());
  });

  protected pickQuick(kind: DeadlineQuick): void {
    this.deadlineChange.emit(quickDeadline(kind, this.clock.now()));
  }

  protected onDate(event: Event): void {
    const date = (event.target as HTMLInputElement).value;
    this.deadlineChange.emit(date === '' ? null : fromInputValue(`${date}T${this.timeInput() || '09:00'}`));
  }

  protected onTime(event: Event): void {
    const time = (event.target as HTMLInputElement).value;
    const date = this.dateInput();
    if (date !== '' && time !== '') {
      this.deadlineChange.emit(fromInputValue(`${date}T${time}`));
    }
  }

  protected onValue(event: Event): void {
    this.valueChange.emit((event.target as HTMLInputElement).value);
  }

  protected onTitle(event: Event): void {
    this.titleChange.emit((event.target as HTMLInputElement).value);
  }

  protected onDescription(event: Event): void {
    this.descriptionChange.emit((event.target as HTMLTextAreaElement).value);
  }

  protected submit(event: Event): void {
    event.preventDefault();
    if (!this.busy()) {
      this.saved.emit();
    }
  }
}
