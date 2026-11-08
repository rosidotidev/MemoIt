---
title: 'Epic 6 review fixes'
type: 'bugfix'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
---

Intent: close the findings of the epic 6 code review (stories 6.1, 6.2) worth fixing now, plus the two 6.2 deferred points and the epic 5 retro action 1 (chart follows the theme).

## Implementation Notes

- Review: three nested reviewers launched for real (blind hunter, edge case hunter, verification gap) on the epic diff; acceptance auditor skipped (no-spec mode). Triage: false: "no rules for preferences" (rules and tests exist); rejected as low or complex: swatch re-click, old Safari matchMedia, label typing.
- `PreferencesStore`: `prefs` is now optimistic (base of every document), `saved` is the rollback baseline only; rollback restores just the field the failed choice changed; overlapping language and appearance saves no longer write each other stale. A choice before the first load awaits it (`loading`, never rejects) and the load keeps fields the user already chose while applying the rest, so the stored document is not overwritten with mirror values. Identity changes are tracked by `idSeq`. Sign-out and user switch also reset Language and its mirror. New `revertPreview()`, called when Settings is destroyed.
- Report chart re-reads theme tokens after a theme change: `ThemeVersion` signal bumped by `ThemeService`, read in the chart config computed.
- Tests: store (sign-out reset, late load of another user, overlapping saves, choice before load, revert), App applies `data-scheme`, rules test with the real `toPrefsDoc` output.
- Not fixed (deferred-work.md): theme flash before bootstrap, old Safari matchMedia, re-click saves, label typing, slider a11y, theme-color meta, silent load failure.
- The fixes were done inline by the closing agent (the full bmad-build flow was followed in intent only; no extra reviewer round on the fixes).
- Verification: `ng build` ok; `npm run check`: lint ok, 362 unit tests (48 files), 68 rules tests.
