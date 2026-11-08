---
title: 'MemoIt in-memory HTML prototype'
type: 'feature'
created: '2026-11-06'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-11-06/EXPERIENCE.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-11-06/DESIGN.md'
  - '{project-root}/_bmad-output/planning-artifacts/prds/prd-bmad612_home-2026-11-06/prd.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** MemoIt has PRD and UX specs but nothing clickable to evaluate the experience with real interaction.

**Approach:** Build a single self-contained HTML file, `doc/MomoItPrototype.html`, implementing every PRD feature (FR-1..FR-14, plus sort, search/filter, due-soon, summary, deadline alert) taking inspiration only from the UX docs (EXPERIENCE.md, DESIGN.md), not the mockup code. All data lives in JS memory only (lost on reload; no localStorage, no backend). Add `doc/README.md` stating credentials are `admin` / `admin`.

</frozen-after-approval>

## Implementation Notes

Single HTML file plus doc/README.md written. Browser unavailable, so only a syntax check was run.

## Review Triage Log

- medium, fixed: demo alert deadline set at page load; now reset at login. Dune seed value 0 skewed the report; removed. Saving in a non-reportable category wiped Value; now kept. Infinity and `$&` titles; fixed. Row focus lost after toggle; fixed.
- low, deferred: sum aggregation for weight-like data; no browser history routing; partial i18n of seed data; no Undo on delete; menu arrow keys.
