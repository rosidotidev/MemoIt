---
title: 'Epic 4 review fixes'
type: 'bugfix'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Epic 4 code review: the Home summary counts Items of Categories that are not loaded (disagrees with the Due soon strip) and shows 0 while Items load; a year before 1970 in the Deadline input could make `Timestamp.fromMillis` throw; no tests for the Deadline read path (`fromDoc`), the shell alert banner, priority/deadline wiring on the new and edit pages, `initialDraft` with a Deadline, and the overdue row chip.

**Approach:** Filter the summary by loaded Categories and render it only when Items are ready; `fromInputValue` rejects negative timestamps; add the missing tests.

</frozen-after-approval>

## Implementation Notes

- Inner review layers skipped on purpose: direct fixes of findings from the epic-level three-layer review.
- Rejected as false: eslint `no-restricted-syntax` replacing `layerRules` (they use `no-restricted-imports`/`globals`); seconds or partial `datetime-local` values (step is 60 s, `change` fires only on complete or empty values; empty clears by design); Firestore rules shape validation (tracked for 5.1); i18n and a11y nits (7.1).
- Deferred: see deferred-work.md, "Code review of epic 4".
