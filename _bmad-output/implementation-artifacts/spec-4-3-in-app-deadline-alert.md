---
title: '4-3 In-app Deadline alert'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

Intent: `ReminderService` (core/data) derives, from `ItemStore` and `ClockService`, the open Items whose Deadline arrived within the last minute (`domain/reminder.ts`); the shell shows one banner under the top bar ("Due now: title"), auto-dismissed after 8 s, tap opens the Item. One alert per `(itemId, deadline)`, kept in `sessionStorage` (`memoit.alerted`); reset on session change via `SessionScope`. No Notifications, push or server code.

Decisions (no user): window of 60 s matches the 30 s clock tick; several due Items queue and show one at a time, skipping Items done or deleted while waiting; the service lives in core/data because the layer rule forbids state importing data; polite live region (`role="status"`), tertiary-container colors, Open label so the tap target is not color alone; no banner on load for Deadlines older than a minute.

Verification: `ng build` ok; `npm run check`: lint ok, 284 unit tests (40 files), 55 rules tests.
