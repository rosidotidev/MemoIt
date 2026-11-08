---
title: 'Epic 2 review fixes'
type: 'bugfix'
created: '2026-11-06'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Epic 2 code review: Firestore `not-found` on update mapped to `unknown`; settings form not re-synced on route-id change; `reportable` not re-synced after save; save feedback untested.

**Approach:** Map `not-found` to `notFound` end to end, re-load the form in an effect keyed on the route id, re-sync `reportable`, add tests.

</frozen-after-approval>

## Implementation Notes

- `CategoryErrorCode` gains `notFound` (so `AddError` too; `categories.errors` gets the string in en/it). Store `CODES` extended.
- Settings: constructor effect keyed on `id()` with `untracked` store read.
- Inner review layers of bmad-build skipped on purpose: this change is a direct fix of already-reviewed findings (the epic review just ran three layers). Sprint status untouched on instruction.
- Verification: `ng build` ok; `npm run check`: lint ok, 127 unit tests, 49 rules tests passing.
