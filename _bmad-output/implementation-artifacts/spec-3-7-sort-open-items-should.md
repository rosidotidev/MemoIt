---
title: '3-7 Sort open items (Should)'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Open Items can only be read newest first; urgent ones cannot be brought to the top.

**Approach:** A sort icon on the Items screen opens a sheet (bottom on compact, centered otherwise) offering Newest first (default), Priority, Deadline; choosing one closes it. Sort applies to open Items only (Done stay at the bottom) and is remembered per Category in `localStorage`. Missing values sort last, order is stable. The sheet traps focus and restores it on close.

</frozen-after-approval>

## Implementation Notes

Decisions (non-interactive, keep it small):
- `domain/item-sort.ts`: `ITEM_SORTS`, `isItemSort`, `sortOpenItems` (stable; Priority high>medium>low; Deadline reads an optional `deadline` epoch ms that Item does not carry until Epic 4, so today it keeps the Newest order).
- `ViewState` gets `getSort`/`setSort` (key `memoit.view.<uid>.<categoryId>.sort`), same try/catch pattern as the filter.
- `shared/sort-sheet.component.ts`: modal with radio-like option buttons (`aria-pressed`), focus trap, Escape/scrim close, focus restore; layout by CSS media query (bottom sheet under 768 px).
- Filtering keeps the sort order (filter runs on the already sorted list).

## Review Triage Log

- Italian strings lost accents (encoding of my edit script): high, real; patched (strings.ts restored and re-edited as UTF-8).
- Deadline option is a no-op until Epic 4: by design (AC: missing values sort last, stable); low, rejected.
- Sheet a11y (aria-pressed vs radio, duplicate scrim label, no inert/scroll lock, aria-expanded, reduced motion, safe-area): low/medium; deferred to 7.1.
- Missing tests (sort-sheet unit spec, Tab wrap, focus restore, ViewState sort fallback, sort reset on Category switch): medium; deferred.
- Sheet type is `string` not `ItemSort`; sheet dropped if store reloads into error; hard-coded 768 px; no spec ACs section: low, rejected.
