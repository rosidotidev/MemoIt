---
title: 'Epic 3 review fixes'
type: 'bugfix'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Epic 3 code review: dead Overdue/Has deadline chips (and a no-op deadline sort) empty the list; Item `not-found` mapped to `unknown`; search text and sort sheet leak across Categories in the two-pane layout; Clear done / Delete category dialogs open while Items are not loaded (counts show 0) and Clear opens with zero done; Cancel on New Item during a save drops the draft; rules tests never exercise `toDoc` create or owner delete (single and batch).

**Approach:** Remove the dead chips/sort option until Epic 4; map `notFound` end to end; reset query and sort sheet on category change; gate the dialogs on a ready ItemStore; guard cancel on busy; add rules emulator tests; tighten the edit-draft assertion.

</frozen-after-approval>

## Implementation Notes

- Inner review layers skipped on purpose: direct fixes of findings from the epic-level three-layer review.
- Fixed: dead chips and Deadline sort removed (stored values fall back to All/Newest); `notFound` mapped end to end (backend, store CODES, en/it strings, unit test); query and sort sheet reset on Category change; danger-zone buttons and `ask` gated on a ready ItemStore, Clear ignored with zero Done; New Item cancel ignores a busy save (the form already disables the button, guard is defensive and untested); rules tests for `toDoc` create and owner delete single/batch; edit-draft assertion fixed.
- Verification: `ng build` ok; `npm run check`: lint ok, 251 unit tests (35 files) and 53 Firestore rules tests (emulator) passing.

## Review Triage Log

- Blind "no spec files in the diff": false, the reviewed patch excluded `*.spec.ts` by construction; specs exist.
- Orphans via other devices, non-atomic Category delete, createdAt 0, re-entrancy, state hygiene, duplication, a11y: real but low/medium and not caused by a single fixable defect; deferred (deferred-work.md, "Code review of epic 3").
- Rules/index gaps: items rules exist (firestore.rules validItem); missing tests added. Index claim: no composite query is used.
- Medium fixed: dead chips, notFound, query leak, dialogs while loading, rules test gaps.
