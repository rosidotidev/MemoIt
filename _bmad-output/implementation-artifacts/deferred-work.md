- source_spec: `_bmad-output/implementation-artifacts/spec-memoit-in-memory-prototype.md`
  summary: Prototype lacks hash/history routing, per-category aggregation choice, Undo on deletes and menu arrow-key support.
  evidence: Reported by blind review; low impact for a throwaway in-memory prototype.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-angular-22-scaffold-and-firestore-rules-with-emulator-tests.md`
  summary: Add negative-fixture tests proving the ESLint layer rules, check-no-functions and check-prod-env fail on violations; add the template-text scan and the date/number-API lint rules (AD-15 b, d, e).
  evidence: Review found the guards only verified manually once; the text scan and date/number rules were out of the 1.1 task list.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-1-angular-22-scaffold-and-firestore-rules-with-emulator-tests.md`
  summary: Make direct `ng build -c production` fail with the clear message, and make check-prod-env reject placeholder or emulator values.
  evidence: The guard lives only in `npm run build:prod`; a bare production build shows Angular's generic error.

- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-sign-in-with-a-persistent-session.md`
  summary: Material `*Intl` providers (AR14) not added; add them in the first story that uses a Material component.
  evidence: Story 1.2 UI uses no Material components, so there is nothing to localize yet.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-2-sign-in-with-a-persistent-session.md`
  summary: Handle `signOut` rejection, `initFirebase` failure at bootstrap, reactive redirect to /login on sign-out, returnUrl; test app initializer and FirebaseAuthBackend mapping; make the epoch bump synchronous when stores start using `isCurrent`.
  evidence: Review findings, real but low impact until Story 1.3 (sign-out UI) and the stores exist.
- source_spec: `_bmad-output/implementation-artifacts/spec-1-3-app-shell-responsive-navigation-and-sign-out.md`
  summary: Account menu arrow-key navigation and focus-out close, nav icons, snackbar dismiss/pause, skip link, focus-visible styles, returnUrl, signOutFailed string, dark tokens.
  evidence: Review findings, low impact for v1; sign-out ordering vs Firebase session report only tested with a fake backend (verify in a browser against the emulator).

## Deferred from: code review of epic 1 (2026-11-06)

- Firestore rules: category delete does not check for items referencing it (orphans). Handled by cascade in story 3.5 (client batch); revisit rules there.
- Firestore rules: `value` accepts NaN/Infinity; `categoryId` has no length/'/' check; `createdAt` can be backdated by the client. Low for a single-owner app; revisit in epic 5 (values).
- Session guard has no timeout if the auth listener never fires (blank page); `app.config` shows no fatal-config screen if `initFirebase` throws. Single-owner, emulator/dev only; revisit if reports appear.
- `sessionGuard` drops the deep-link target (no `returnUrl`); user always lands on /categories after sign in.
- `AuthService.signIn` sets session directly while `onChange` also writes it; a sign-out landing while a sign-in is in flight could be overwritten (profile null until listener fires). Very unlikely.
- Account menu does not close on Tab focus-out; snackbar does not re-announce an identical repeated message.
- `connectAuthEmulator`/`connectFirestoreEmulator` retry after partial failure is not idempotent (dev only).
- `template-text.spec.ts` literal scan only covers double-quoted attrs; ESLint layer regex matches any path segment named data/shared/features/shell; `.spec.ts` override disables restricted imports.
- Login form: native `required` tooltips are untranslated, no aria-pressed on Show/Hide, tests hard-code English strings. Revisit with epic 6 (language) and 7.1 (accessibility).
- `firebase.json` has no security/cache headers; `deploy` lacks `--project`; `.gitignore` has duplicated debug-log lines (cosmetic).

## Deferred from: build of story 2.1 (2026-11-06)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-create-and-list-categories.md`
  summary: A timed-out category write may still commit later and a retry can create a duplicate; re-read before the next write (AD-5) not implemented. Also no timeout on the initial load, and an add confirmed during an in-flight reload can vanish until the next reload.
  evidence: Review (edge case, blind). Real but rare; needs a reload-on-timeout in CategoryStore.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-1-create-and-list-categories.md`
  summary: New category dialog: tests for focus restore, Shift+Tab wrap and busy state; focus may leave the modal while busy; background not inert. ItemsComponent has no fallback when the Category vanishes; search is not accent-insensitive; FAB overlaps last card; button CSS duplicated; `--scrim` has no dark value; skeleton not announced.
  evidence: Review findings, low impact; fold into 7.1 accessibility pass.

## Deferred from: build of story 2.2 (2026-11-06)

- source_spec: `_bmad-output/implementation-artifacts/spec-2-2-category-settings-rename-state-label-reportable.md`
  summary: Settings screen: no resync when the route id changes in place, `notFound` on save does not redirect (Firestore `not-found` maps to unknown), backend `invalid` shown under the name field, maxlength counts UTF-16 while validation counts code points, unchanged Save still writes, State Label suggestions not localized.
  evidence: Review (edge case, blind). Low impact for a single-owner app.
- source_spec: `_bmad-output/implementation-artifacts/spec-2-2-category-settings-rename-state-label-reportable.md`
  summary: Category menu: no focus move, arrow keys or Tab-out close; no focus-visible styles on settings controls; empty role=alert paragraphs; Saving not announced; rules tests for createdAt change/extra fields on category update.
  evidence: Review findings; fold into the 7.1 accessibility pass.

## Code review of epic 2 (2026-11-06)

- source_spec: `spec-epic-2-review-fixes.md`
  summary: A timed-out write (10 s) may still commit later (offline queue); retry of create can duplicate a Category. Name uniqueness is client-side only.
  evidence: withTimeout rejects without cancelling setDoc; v1 cuts offline, so tolerable. Revisit with a deterministic id or reload-on-timeout.
- source_spec: `spec-epic-2-review-fixes.md`
  summary: `CategoryBackend.list` has no load timeout and `categoryGuard` redirects to /categories when status is `error` (drops deep link); no test for guard on error.
  evidence: getDocs can hang on skeletons; guard maps error like unknown id.
- source_spec: `spec-epic-2-review-fixes.md`
  summary: `FirestoreCategoryBackend` (list/create/update, path users/{uid}/categories) has no test; only pure mappers and the rules are tested.
  evidence: all specs use fakes. Add an emulator-based test when Items backend lands (Epic 3) with the same pattern.
- source_spec: `spec-epic-2-review-fixes.md`
  summary: Settings/cards show hard-coded 0 counts until Items exist; fixed in story 3.1+.
  evidence: placeholders by design (Epic 3).
- source_spec: `spec-epic-2-review-fixes.md`
  summary: A11y/UX nits: dialog keydown only on .dialog, no inert background, Shift+Tab and Escape-while-busy untested, menu arrow keys, :focus-visible on chips/switch/cards, FAB overlap, empty-opener focus restore, duplicated button/field CSS, hard-coded --scrim in :root, maxlength UTF-16 vs code points, no diacritic folding in search, blank card for doc without name, no unsaved-changes guard, store 'unknown' when not ready, reload overlapping a write.
  evidence: reported by Blind/Edge/Verification reviewers; low impact in v1. Cover the a11y ones in story 7.1.

## Deferred from: build of story 3.1 (2026-11-06)

- source_spec: `spec-3-1-add-an-item-and-see-the-list.md`
  summary: Timed-out Item write may commit later and a retry duplicates it; reload during an in-flight add can drop the new Item; createdAt uses client Date.now() until reload.
  evidence: Edge-case and blind review; same pattern as Categories, offline is cut in v1. Reload-on-timeout covers all.
- source_spec: `spec-3-1-add-an-item-and-see-the-list.md`
  summary: Item form saves while ItemStore is loading/error with a generic error; home cards show 0% while Items load or fail; no emulator test of FirestoreItemBackend (retro action 2); draft rehydrate across navigation untested.
  evidence: Review findings, low impact; do the emulator test with 3.2.
- source_spec: `spec-3-1-add-an-item-and-see-the-list.md`
  summary: Progress summary string has hard-coded word order; titleMax/descriptionMax unused (no maxlength, limits in strings); a11y nits (three alert regions, focus to invalid field, FAB overlap, aria-hidden checkboxes); fromDoc blanks corrupt docs; no pagination.
  evidence: Blind review; fold into epic 6 (language) and 7.1 (a11y).

- source_spec: `_bmad-output/implementation-artifacts/spec-3-2-edit-an-item.md`
  summary: itemGuard redirects on load error like an unknown id; ItemStore.update session-change branch untested; edit aria-label built by concatenation.
  evidence: low-severity review findings on story 3.2, see its Review Triage Log.

- source_spec: `spec-3-3-mark-done-with-undo.md`
  summary: No emulator test of `FirestoreItemBackend.fetch`/`setDone`; session change during the AD-5 re-read untested; a network-coded failure may still apply later without marking the Item stale.
  evidence: Verification-gap and edge-case review; fakes cover the store logic, rules test covers the doc shape.
- source_spec: `spec-3-3-mark-done-with-undo.md`
  summary: Focus is lost when a toggled row moves between sections; snackbar has no pause on hover/focus and Undo gives no feedback when ignored; message built by concatenation (word order for it); `.toggle` has no focus-visible style and uses magic padding.
  evidence: Blind and edge review; fold into 6.1 (language) and 7.1 (accessibility).

- source_spec: `spec-3-4-delete-an-item.md`
  summary: Timed-out delete that lands later leaves the Item in the list until reload; Item missing remotely makes `remove` return unknown; session-change error is shown inline; navigation after destroy while pending.
  evidence: Edge and blind review, low impact (no offline, reload covers it).
- source_spec: `spec-3-4-delete-an-item.md`
  summary: ConfirmDialog a11y: Tab/Escape lost when busy disables buttons or scrim is focused, hard-coded element ids (3.5 reuse), no inert background, focus-restore not asserted, scrim dismiss on a destructive prompt, delete-specific error copy, `.delete` CSS in item-new css.
  evidence: Review findings; fold into 7.1 (accessibility) and 3.5 (reuse).

- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-clear-done-items-and-delete-a-category.md`
  summary: Category delete removes only Items present in the local ItemStore; Items created on another device since load would be orphaned.
  evidence: `CategoryStore.remove` uses `ItemStore.removeAll` over the loaded signal; a server query of the Category's Items would close it.
- source_spec: `_bmad-output/implementation-artifacts/spec-3-5-clear-done-items-and-delete-a-category.md`
  summary: A timed-out batch or Category delete may still commit later, leaving the UI stale until reload; danger-zone copy ignores the custom Done label.
  evidence: `withTimeout` cannot cancel Firestore writes; strings say "done" instead of the stateLabel.

- source_spec: `spec-3-6-search-and-filter-chips.md`
  summary: Search text may persist when the Category route param changes in place; no ViewState unit test (corrupt/throwing storage, per-uid isolation) and no test that filtering keeps the sort order (add with 3.7).
  evidence: Blind review; low impact. A11y nits (clear button, focus-visible on search/chips, result count live region, accent folding) fold into 7.1.

- source_spec: `spec-3-7-sort-open-items-should.md`
  summary: Sort sheet a11y (aria-pressed instead of radio semantics, duplicate scrim/Close label, no inert background or scroll lock, no aria-expanded, no reduced-motion/safe-area) and missing tests (sort-sheet unit spec with Tab wrap and focus restore, ViewState sort fallback, sort reset on Category switch).
  evidence: Blind review; low/medium impact, fold into 7.1 (accessibility).

## Code review of epic 3 (spec-epic-3-review-fixes.md)

- source_spec: `spec-epic-3-review-fixes.md`
  summary: Category delete and Clear done act only on Items in the local cache (one-time load, no listeners): Items created on another device are orphaned; a timed-out batch may commit later; Category delete is not atomic across batches (a retry finishes it). Retro 2 action 3 stays open as a known v1 limit.
  evidence: Edge and blind review, verified in `CategoryStore.remove` / `ItemStore.removeIds`. A server query by categoryId before delete would close it; no rule enforces category existence on read.
- source_spec: `spec-epic-3-review-fixes.md`
  summary: Rules do not bound `priority`/`categoryId` shape beyond the existing validators; `FirestoreItemBackend` still has no emulator test of `list`, `fetch`, `setDone`, `removeMany` (only rules-level shape tests).
  evidence: Blind and verification-gap review; retro 2 action 2 only partly met.
- source_spec: `spec-epic-3-review-fixes.md`
  summary: `createdAt` comes back from `create` as `Date.now()` but reads as 0 from a pending server timestamp (offline/cache), so order can jump after reload; no ItemStore re-entrancy guard on removeIds/removeDone/removeAll; update/remove of an Item removed meanwhile (Clear done during a save) report `unknown`; toggle fetch in the stale path overwrites local fields.
  evidence: Edge and blind review; narrow races, offline is cut in v1.
- source_spec: `spec-epic-3-review-fixes.md`
  summary: Local state hygiene: DraftStore entries and `memoit.view.*` localStorage keys are not dropped when an Item or Category is deleted; the edit form shows the new-Item draft briefly when `stored()` is undefined; categories cards show 0% while Items load or fail; itemGuard redirects silently on a load error.
  evidence: Edge-case review; low impact, no data loss.
- source_spec: `spec-epic-3-review-fixes.md`
  summary: Duplication (Open/Done row templates, new/edit save logic, `toCode`/`mapItemError` vs Category), ConfirmDialog focus when busy, item-edit reusing item-new CSS, missing tests for the `remove`-while-toggle-in-flight guard, hand-formatted spec files outside Prettier layout, `ItemStore.add` not discarding failure after a session change.
  evidence: Blind and verification-gap review; developer-only, fold into 7.1 and a later cleanup.
- source_spec: `spec-epic-3-review-fixes.md`
  summary: Overdue and Has deadline chips and the Deadline sort were removed from the UI (they were no-ops); strings `filterOverdue`/`filterDeadline`/`sortDeadline` are kept for Epic 4 (story 4.2) to reinstate them with real deadlines.
  evidence: Review finding fixed by removal; Epic 4 must re-add chip values, sort case and tests.

## Code review of epic 4 (spec-epic-4-review-fixes.md)

- Alert window is 60 s: Deadlines that pass while the app is closed or the tab is throttled never alert (only the Overdue flag shows). Revisit if users miss them.
- A banner already showing is not cleared when its Item is marked Done or deleted; queued alerts hold Item snapshots (stale title if edited while queued).
- Alert `seen` set is not keyed by uid and never pruned (session scope only; reset on sign-out).
- Due soon strip caps at 10: more than 10 overdue Items crowd out upcoming ones.
- Quick-chip highlight tracks the clock, so it can drift after midnight while the stored Deadline is unchanged.
- Low priority has no chip on rows (only High).
- Banner a11y (live region inserted populated, 8 s auto-dismiss with no pause): fold into the 7.1 pass.
- Firestore rules shape validation of `deadline` and `priority`: already tracked for 5.1.

## Code review of epic 5 (spec-epic-5-review-fixes.md)

- Chart colors are read from the theme tokens when the config is computed, so they do not follow a live theme change: re-render on theme change in 6.2.
- `roundValue` can return -0 for tiny negatives (display is guarded in `formatNumber`; summary values are not affected).
- Several Reportable Categories: the chosen one is not persisted; no per-Category comparison.
- Report has no emulator or browser run; the chart canvas a11y (role img, table in `details`) goes into the 7.1 pass.
- Value is not shown on item rows; the stored Value of an Item moved to a non-Reportable Category stays stored but is not reported.

- source_spec: `_bmad-output/implementation-artifacts/spec-6-2-choose-theme-and-accent.md`
  summary: Non-indigo or dark users see the default indigo-light theme until the app bootstraps.
  evidence: ThemeService writes tokens from an effect after bootstrap; styles.css holds indigo-light defaults; an inline pre-bootstrap script would duplicate the token mapping.
- source_spec: `_bmad-output/implementation-artifacts/spec-6-2-choose-theme-and-accent.md`
  summary: Overlapping appearance saves can leave the cached document stale, and an unsaved slider preview stays on screen if no change event fires.
  evidence: setAppearance only assigns prefs when its seq is still current; previewAppearance does not bump seq (edge-case review).

## Code review of epic 6 (spec-epic-6-review-fixes.md)

- Theme flash before bootstrap: the effect runs in the first tick; an inline pre-bootstrap script would duplicate the token mapping. Not fixed.
- `matchMedia` without `addEventListener` (old Safari) is not handled in `ThemeService`.
- Clicking an already-selected swatch or scheme saves again.
- `strings.settings.accents` is `Record<string, string>`: a new preset without a label is not caught at compile time.
- Sliders have no `aria-valuetext` or visible number (a11y pass in 7.1); no `<meta name="theme-color">` update.
- A failed initial load of the preferences is silent; the next choice writes the full document from the mirrored values.
- The Report chart now follows a theme change through `ThemeVersion`; not seen in a browser.

## Deferred from: code review of epic 7 (2026-11-07)

- `test:e2e` is not part of `npm run check` or `deploy` and there is no CI: accessibility and journey regressions are caught only on demand (deliberate, spec 7.1).
- Coverage gaps in the a11y floor: 48 px scan skips edit item, category settings, login and overlays; focus trap only on two dialogs (sort sheet, Clear done untested); reduced motion only on /categories; reflow uses `zoom: 2` on 3 routes; axe skips sort sheet states, Clear done dialog, alert, empty and error states.
- Static `theme-color` / `background_color` ignore dark scheme and accent; manifest name/description not localized; apple-touch-icon is 192 px.
- `reuseExistingServer: true` has no guard that a dev server on 4200 points at the emulators (default environment does).
