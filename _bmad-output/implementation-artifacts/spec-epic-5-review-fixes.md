---
title: 'Epic 5 review fixes'
type: 'bugfix'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
---

Intent: close the findings of the epic 5 code review (stories 5.1, 5.2) that are worth fixing now.

## Implementation Notes

- `buildSeries` ignores Values dated more than a year ahead of `now`: a stray Deadline (year 9999 is accepted by the input) created hundreds of thousands of empty buckets and froze the Report. Test added in `series.spec.ts`.
- Review was done inline on the epic diff (no nested reviewer subagents launched); logic of `number.ts`, `series.ts`, rules and the backend mapping read in full, no other defect found.
- Verification: `ng build` ok, `npm run check`: lint ok, 335 unit tests (44 files), 67 rules tests.
