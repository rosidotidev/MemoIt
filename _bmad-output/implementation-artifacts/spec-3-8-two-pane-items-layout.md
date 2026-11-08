---
title: '3-8 Two-pane Items layout'
type: 'feature'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** On a wide screen the User must go back to the Category list to switch Category.

**Approach:** From 1024 px the Items screen shows the Category list on the left (current one selected, `aria-current`) and the Items on the right; the back arrow is hidden. Choosing a Category navigates to its route. Below 1024 px the single column and back arrow return.

</frozen-after-approval>

## Implementation Notes

Decisions (non-interactive, keep it small):
- AC says 1024 px but `windowClass` thresholds are 768/1200 (UX-DR2). Added `twoPane` (>= `TWO_PANE_MIN` 1024) to `LayoutService`, still the only place that measures the window; `ItemsComponent` reads only it.
- The pane is a plain `<nav>` of links inside `ItemsComponent` (no new component, no new strings: label reuses `nav.categories`). No search, counts or "New category" in the pane.
- Tests: layout spec (twoPane), items spec (1024 vs 1023); existing items tests pin width to 500.
