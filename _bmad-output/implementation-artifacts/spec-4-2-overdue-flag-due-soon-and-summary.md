---
title: '4-2 Overdue flag, Due soon and summary'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

Intent: Overdue chip on open rows and Overdue filter (re-added to `ITEM_FILTERS`, `matchesFilter/filterItems` take `now`); Categories summary card (overdue headline, open, due this week, Categories) and Due soon strip derived from the loaded Items (`domain/summary.ts`); open-count badge on Category cards.

Decisions (no user): "due this week" = open, not overdue, Deadline before next Monday 00:00 (`nextWeekStart` in `time.ts`); Due soon strip capped at 10, only Items of loaded Categories; Overdue chip uses new `--on-error-container` token and the word "Overdue" (not color alone); Done Items never flagged; the Deadline sort case already existed from 4.1.

Verification: `ng build` ok; `npm run check`: lint ok, 274 unit tests (38 files), 55 rules tests.
