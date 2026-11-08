---
title: 'Story 6.2: Choose theme and accent'
type: feature
status: done
route: dispatch
baseline_commit: cd8bcec4fdc835aa572620fa347d6e96396eaaf4
---

## Intent
<frozen-after-approval>
User picks one of nine accent swatches or a custom hue/chroma, and Light/Dark/System appearance, in Settings. Every screen recolors at once with a live mini-app preview and no Save button; the choice persists per User in `users/{uid}/preferences/app` (full document) and is mirrored to localStorage (no flash). Error, overdue and High colors never follow the accent. AA contrast is unit-tested for every preset in both schemes and sampled custom hues; no color literal in components.
</frozen-after-approval>

## Code Map
- `src/app/shared/theme.ts`: pure OKLCH tonal mapping (tone = OKLCH lightness, chroma reduced into sRGB gamut), `tokensFor(accent, scheme)`, presets, contrast helpers, TEXT_PAIRS/GRAPHIC_PAIRS.
- `src/app/shared/theme.service.ts`: effect writing tokens on `<html>` (`--role`), `color-scheme`, `data-scheme`; `system` follows `prefers-color-scheme`. Injected from `App`.
- `src/app/shared/preferences.store.ts`: `appearance` signal (mirror `memoit.theme`), `previewAppearance` (no save), `setAppearance` (save, rollback + snackbar), load applies stored appearance.
- `src/app/features/settings/settings.component.ts`: Appearance segmented, 9+custom swatches (48 px, ring), hue/intensity sliders (preview on input, save on change), mini-app preview.
- `src/app/domain/preferences.ts`: `Appearance` type. `strings.ts`: new keys en/it. styles.css `--shadow`; account-menu uses it (no literal).
- Tests: `theme.spec.ts` (AA contrast, fixed error/tertiary, literal scan), `theme.service.spec.ts`, store and settings specs.

## Design Notes (decided without the user, keeping the product small)
- Tonal formulas use OKLCH L = tone/100 (not HCT); contrast is verified by the test, not assumed.
- High priority uses tertiary tokens: tertiary and error are fixed hues, independent of the accent.
- Slider saves on release to avoid a write per drag step. `styles.css` keeps indigo-light defaults as pre-JS fallback.
- Preset swatch colors are computed with `tone()`, so components hold no color literal.
- Generic `settings.saveError` now says "settings".

## Review Triage Log
- patch: language save keeps non-default appearance (test added); system scheme + matchMedia change (test added); chroma slider (test added); NaN hue/chroma guard in `accentOf`; extra contrast pairs and 15-degree custom-hue sweep; theme reset on user switch or sign-out.
- defer: first-paint flash for non-indigo/dark users before bootstrap (needs inline pre-bootstrap script duplicating tokens); overlapping-save `prefs` staleness and unsaved preview left on screen; swatch selected state only by ring; scrim/shadow duplicate in styles.css.
- false/rejected: matchMedia addEventListener fallback for old Safari; onSlide guard (sliders render only when custom); unknown accent id (only reachable by hand-edited data).
