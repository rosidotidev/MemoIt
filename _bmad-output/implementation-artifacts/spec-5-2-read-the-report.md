---
title: '5-2 Read the Report'
type: 'feature'
created: '2026-11-07'
status: 'in-review'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/spec-5-1-enter-a-value.md']
---

Intent: `/report` (lazy, Chart.js + ng2-charts) shows, for a Reportable Category, a summary card (latest, change, average, lowest), period chips (3 months, 6 months, 1 year, All), a weekly/monthly switch and one line chart with `spanGaps: true`, plus a table alternative and a link to the Category list. Empty state when no Reportable Category or no Values. Period and grouping kept per device and User in localStorage.

## Implementation Notes

- `domain/series.ts` `buildSeries(items, period, aggregation, now)`: Item placed at deadline else createdAt (local time); weeks start Monday, or calendar months; bucket = sum (rounded with `roundValue`); period filter (lower bound only, calendar months back) applied before bucketing; empty buckets between first and last are `value: null` gaps; summary excludes gaps. Date helpers added to `domain/time.ts` (`monthsAgo`, `bucketStart`, `nextBucketStart`, `formatBucket`).
- `ViewState.getReport/setReport` (keys `memoit.view.{uid}.report.period|aggregation`, defaults 6m / month).
- `features/report/*`: colors read from `--primary`, `--outline-variant`, `--on-surface-variant` at render time; numbers via `formatNumber`; strings it/en in `shared/strings.ts`; route uses `loadComponent` and `provideCharts(withDefaultRegisterables())`.
- Decisions: several Reportable Categories pick via a native select (first by name by default, not persisted); no stored-in-future cut-off; the chart canvas has `role="img"` with a label, the table sits in a `details`. No live theme re-read (Epic 6 may need a re-render on theme change).
- Verification: `ng build` ok (report chunk lazy, 26.7 kB), `npm run check`: lint ok, 334 unit tests, 67 rules tests.
