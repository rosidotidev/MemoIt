---
title: '3-6 Search and filter chips'
type: 'feature'
created: '2026-11-06'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A long Category cannot be searched or narrowed on the Items screen.

**Approach:** Add a search field and four chips (All, Overdue, High priority, Has deadline; exactly one active) above the lists. Both Open and Done sections filter in memory. The chip choice is kept per device in `localStorage` keyed by uid and Category; the search text is not persisted. Overdue and Has deadline match nothing until Epic 4 adds deadlines; High priority matches `priority === 'high'`. An empty result shows a neutral message.

</frozen-after-approval>

## Implementation Notes

Decisions (non-interactive, keep it small):
- Pure filter functions in `domain/item-filter.ts` (query match on title and description, case-insensitive; chip predicates). Overdue and Has deadline return false until the Item has deadline fields (Epic 4).
- `ViewStateService` (`core/state`) wraps `localStorage` with try/catch; key `memoit.view.<uid>.<categoryId>.filter`.
- Head-card counts and progress stay unfiltered; the Items screen shows search and chips only when the Category has Items.
- Search is not accent-insensitive (already deferred for Categories).

## Review Triage Log

- Search text may carry over when the route param changes in place: low (route change normally recreates the view; chip state is keyed per Category); deferred.
- Overdue and Has deadline are dead chips until Epic 4, same message as no search hits: by design (AC); low.
- Chip fallback when localStorage write fails holds only the last Category chosen: low, rejected.
- No clear button, no focus-visible styles, no live count for results, no accent folding: low; fold into 7.1 (a11y).
- Missing ViewState unit test (corrupt value, throwing storage, per-uid isolation) and sort-order-preserved test (relevant to 3.7): low/medium; deferred.
- Stale localStorage keys after Category delete or sign-out: low, rejected.
- `ITEM_FILTERS.includes` cast: low, rejected.
