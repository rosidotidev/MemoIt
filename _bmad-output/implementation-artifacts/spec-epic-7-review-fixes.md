---
title: 'Epic 7 review fixes'
type: 'bugfix'
created: '2026-11-07'
status: 'done'
route: 'oneshot'
---

Intent: close the findings of the epic 7 code review (stories 7.1, 7.2) worth fixing now.

## Implementation Notes

- Review: four layers launched for real (blind hunter, edge case hunter, verification gap, acceptance auditor against spec 7.1) on the epic diff (f84e1fc, 2bd3109); the stories had skipped nested reviewers.
- Triage, false: UJ-5 `browser.newContext()` losing baseURL/viewport (Playwright applies the `use` options to it; the test passes). Rejected as low or complex: 1.4.4 text-spacing, pseudo-element and delay checks in the reduced-motion test, apple-touch-icon 180 px, iOS meta tags, manifest `id`/`lang`.
- Fixed: stable `button.avatar` locator for the account menu axe step; trace `retain-on-failure`; UJ-5 contexts closed in try/finally; `.gitignore` for `blob-report/` and `playwright/.cache/`; manifest `start_url` `./categories` and `scope` `./` (sub-path safe), spec assertion adjusted.
- Deferred (deferred-work.md): `test:e2e` outside `check`/`deploy` (deliberate), wider 48 px / axe / focus-trap / reduced-motion / reflow coverage (sort sheet, Clear done dialog, edit item, login), static `theme-color`, manifest i18n, no guard that a reused dev server points at the emulators.
- The fixes were done inline by the closing agent (no extra reviewer round on the fixes).
- Verification: `ng build` ok; `npm run check`: lint ok, 365 unit tests (49 files), 68 rules tests; `npm run test:e2e`: 12 passed.
