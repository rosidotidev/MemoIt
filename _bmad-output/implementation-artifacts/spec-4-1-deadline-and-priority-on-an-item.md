---
title: '4-1 Deadline and priority on an item'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

Intent: Priority tiles and Deadline (quick chips plus date and time) in the Item form with live preview; row chips; Has deadline filter and Deadline sort re-added; `domain/time.ts` and `ClockService` with ESLint rule against date construction elsewhere (AD-15b).

Decisions (no user): quick Deadlines are end of day 23:59 local (today, tomorrow, +7 days); week starts Monday; Deadline stored as Firestore Timestamp, absent when cleared (deleteField); `ItemStore.add/update` take an optional `{priority, deadline}`; Overdue chip stays for 4.2; High chip uses new tertiary tokens (light only, dark in epic 6).

Verification: `ng build` ok; `npm run check`: lint ok, 268 unit tests (37 files), 55 rules tests.
