---
title: 'MemoIt prototype: 100% UX fidelity to the mockups'
type: 'refactor'
created: '2026-11-06'
status: 'done'
route: 'oneshot'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-11-06/mockups/'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** `doc/MomoItPrototype.html` does not look or behave like the UX mockups in `_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-11-06/mockups/`; the user requires it to be identical and 100% compliant.

**Approach:** Rebuild the single HTML file by inlining `mockups/assets/m3.css` verbatim and reproducing the exact markup, classes, copy, sample data and interactions of every mockup screen (login, categories, empty state, items, item edit, category settings, report, settings, account menu, dialogs, snackbar). Replace page-to-page links with hash routing and all static sample data with in-memory state so every feature works. No localStorage; login `admin` / `admin`; README unchanged in meaning.

</frozen-after-approval>

## Implementation Notes

Rebuilt `doc/MomoItPrototype.html` from a template that inlines `m3.css` verbatim; markup, copy and sample data mirror each mockup; hash router replaces page links. Italian strings keyed by the English mockup copy.

## Review Triage Log

- Review layer skipped: Blind Hunter (user asked for a fidelity rebuild; verified instead with a jsdom smoke test of all screens and flows: 34 checks, 0 script errors).
- high, fixed: `alerted.delete` on a plain object broke saving an item (found by the smoke test).
- low, not verified: pixel-level comparison in a real browser (Chrome extension not connected).
