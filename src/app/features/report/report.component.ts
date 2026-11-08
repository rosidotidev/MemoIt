import { AccountMenuComponent } from '../../shared/account-menu.component';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { BaseChartDirective } from 'ng2-charts';
import type { ChartConfiguration } from 'chart.js';
import { CategoryStore } from '../../core/data/category.store';
import { ItemStore } from '../../core/data/item.store';
import { ClockService } from '../../core/state/clock.service';
import { SessionState } from '../../core/state/session.state';
import { ViewState } from '../../core/state/view-state';
import { formatNumber } from '../../domain/number';
import { AGGREGATIONS, PERIODS, buildSeries, type Period } from '../../domain/series';
import { formatBucket, type BucketKind } from '../../domain/time';
import { IconComponent } from '../../shared/icon.component';
import { LanguageService } from '../../shared/language.service';
import { ThemeVersion } from '../../shared/theme.service';

/** Reads a theme token (CSS custom property on the document) at render time; never a color literal in the component. */
function token(name: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
}

/** Report: summary, period chips, weekly or monthly switch and one line chart of a Reportable Category's Values. */
@Component({
  selector: 'memo-report',
  imports: [AccountMenuComponent, RouterLink, BaseChartDirective, IconComponent],
  templateUrl: './report.component.html',
  styleUrl: './report.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ReportComponent {
  private readonly categoryStore = inject(CategoryStore);
  private readonly itemStore = inject(ItemStore);
  private readonly clock = inject(ClockService);
  private readonly view = inject(ViewState);
  private readonly session = inject(SessionState).session;
  private readonly language = inject(LanguageService);
  private readonly themeVersion = inject(ThemeVersion).value;
  protected readonly strings = this.language.strings;
  protected readonly periods = PERIODS;
  protected readonly aggregations = AGGREGATIONS;
  protected readonly itemStatus = this.itemStore.status;

  private readonly uid = computed(() => {
    const s = this.session();
    return s.kind === 'signedIn' ? s.uid : '';
  });
  private readonly chosen = signal<{ uid: string; period: Period; aggregation: BucketKind } | null>(null);
  private readonly chosenCategory = signal<string | null>(null);

  protected readonly period = computed(() => {
    const c = this.chosen();
    return c?.uid === this.uid() ? c.period : this.view.getReport(this.uid()).period;
  });
  protected readonly aggregation = computed(() => {
    const c = this.chosen();
    return c?.uid === this.uid() ? c.aggregation : this.view.getReport(this.uid()).aggregation;
  });

  protected readonly reportable = computed(() => this.categoryStore.categories().filter((c) => c.reportable));
  protected readonly category = computed(() => {
    const list = this.reportable();
    return list.find((c) => c.id === this.chosenCategory()) ?? list[0];
  });

  private readonly series = computed(() =>
    buildSeries(
      this.itemStore.forCategory(this.category()?.id ?? ''),
      this.period(),
      this.aggregation(),
      this.clock.now(),
    ),
  );
  protected readonly hasValues = computed(() => this.series().summary !== null);

  protected readonly hero = computed(() => {
    const s = this.series().summary;
    const lang = this.language.language();
    if (!s) {
      return null;
    }
    const signed = (n: number) => (n > 0 ? `+${formatNumber(n, lang)}` : formatNumber(n, lang));
    const t = this.strings().report;
    const times = this.itemStore
      .forCategory(this.category()?.id ?? '')
      .filter((i) => i.value !== undefined)
      .map((i) => i.deadline ?? i.createdAt);
    const when = times.length
      ? new Intl.DateTimeFormat(lang, { day: 'numeric', month: 'short' }).format(Math.max(...times))
      : '';
    return {
      when,
      latest: formatNumber(s.latest, lang),
      stats: [
        { label: t.change, value: signed(s.change) },
        { label: t.average, value: formatNumber(s.average, lang) },
        { label: t.lowest, value: formatNumber(s.lowest, lang) },
      ],
    };
  });

  protected readonly eyebrow = computed(() => `${this.category()?.name ?? ''} · ${this.strings().report.latest}`);

  protected readonly openListLabel = computed(() =>
    this.strings().report.openList.replace('{name}', this.category()?.name ?? ''),
  );

  protected readonly summary = computed(() => {
    const s = this.series().summary;
    const lang = this.language.language();
    if (!s) {
      return [];
    }
    const t = this.strings().report;
    const signed = (n: number) => (n > 0 ? `+${formatNumber(n, lang)}` : formatNumber(n, lang));
    return [
      { label: t.latest, value: formatNumber(s.latest, lang) },
      { label: t.change, value: signed(s.change) },
      { label: t.average, value: formatNumber(s.average, lang) },
      { label: t.lowest, value: formatNumber(s.lowest, lang) },
    ];
  });

  /** The same series as the chart, as text: used for the table. */
  protected readonly rows = computed(() => {
    const lang = this.language.language();
    return this.series().buckets.map((b) => ({
      label: formatBucket(b.start, this.aggregation(), lang),
      value: b.value === null ? null : formatNumber(b.value, lang),
    }));
  });

  protected readonly chartLabel = computed(() =>
    this.strings().report.chartLabel.replace('{name}', this.category()?.name ?? ''),
  );

  protected readonly chart = computed<ChartConfiguration<'line'>>(() => {
    const lang = this.language.language();
    this.themeVersion(); // re-read the tokens after a theme change
    const buckets = this.series().buckets;
    const line = token('--primary');
    const grid = token('--outline-variant');
    const text = token('--on-surface-variant');
    const surface = token('--surface');
    const last = buckets.length - 1;
    return {
      type: 'line',
      data: {
        labels: buckets.map((b) => formatBucket(b.start, this.aggregation(), lang)),
        datasets: [
          {
            data: buckets.map((b) => b.value),
            borderColor: line,
            borderWidth: 3,
            borderCapStyle: 'round',
            borderJoinStyle: 'round',
            fill: 'start',
            backgroundColor: (ctx) => {
              const { ctx: c, chartArea } = ctx.chart;
              if (!chartArea) {
                return 'transparent';
              }
              const g = c.createLinearGradient(0, chartArea.top, 0, chartArea.bottom);
              g.addColorStop(0, `color-mix(in srgb, ${line} 28%, transparent)`);
              g.addColorStop(1, `color-mix(in srgb, ${line} 0%, transparent)`);
              return g;
            },
            pointBackgroundColor: (ctx) => (ctx.dataIndex === last ? line : surface),
            pointBorderColor: line,
            pointBorderWidth: 3,
            pointRadius: (ctx) => (ctx.dataIndex === last ? 7 : 5),
            pointHoverRadius: 7,
            tension: 0,
            spanGaps: true,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (ctx) => formatNumber(Number(ctx.parsed.y), lang) } },
        },
        scales: {
          x: { grid: { display: false }, border: { display: false }, ticks: { color: text } },
          y: {
            grid: { color: grid },
            border: { display: false },
            ticks: { color: text, callback: (v) => formatNumber(Number(v), lang) },
          },
        },
      },
    };
  });

  protected periodLabel(p: Period): string {
    const t = this.strings().report;
    return { '3m': t.period3m, '6m': t.period6m, '1y': t.period1y, all: t.periodAll }[p];
  }

  protected selectPeriod(period: Period): void {
    this.choose(period, this.aggregation());
  }

  protected selectAggregation(aggregation: BucketKind): void {
    this.choose(this.period(), aggregation);
  }

  protected selectCategory(id: string): void {
    this.chosenCategory.set(id);
  }

  protected retry(): void {
    this.itemStore.reload();
  }

  private choose(period: Period, aggregation: BucketKind): void {
    this.chosen.set({ uid: this.uid(), period, aggregation });
    this.view.setReport(this.uid(), period, aggregation);
  }
}
