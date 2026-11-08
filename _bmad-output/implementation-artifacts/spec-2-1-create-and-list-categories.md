---
title: '2-1 Create and list Categories'
type: 'feature'
created: '2026-11-06'
status: 'done'
baseline_commit: 'f3bd97f1955d8b9102664df1fb3bbfb7a5a1e4c9'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-3-app-shell-responsive-navigation-and-sign-out.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** After sign-in the User sees a placeholder at `/categories`; there is no way to create a Category, list them, or open one (FR3, UX-DR4, UX-DR5).

**Approach:** Add `domain/category.ts`, a `CategoryStore` (load once, confirmed writes, 10 s timeout) over a swappable `CategoryBackend` (Firestore, emulator only), the Categories home with search, cards and a New category dialog, and a `/c/:categoryId` shell with an unknown-id guard.

## Boundaries & Constraints

**Always:** Layers per AD-1: only `core/data` imports Firebase. Standalone, OnPush, signals, prefix `memo-`, specs next to files. All text from `strings.ts` (en and it); no literal text in templates. Colors from tokens; targets at least 48 px. Writes are full documents by auto id (`setDoc`, no merge) with `serverTimestamp()` for `createdAt` and `updatedAt`, fields exactly `name, stateLabel ('Done'), reportable (false), createdAt, updatedAt`. Name is trimmed, 1 to 60 chars, unique case-insensitive among loaded Categories. Store `add` returns `{ok:true, category}` or `{ok:false, error}` with error in `network | timeout | permission | invalid | unknown` (plus `duplicate | empty` caught before the write); signal updated only after the confirmed write; a result for a different session is discarded. Cards sorted by name, show progress derived from Items (always 0 for now, via a domain function). No hand-built Material.

**Never:** Items, ItemStore, summary card, Due soon strip, greeting, Category settings/rename/delete (2.2, 3.x), realtime listeners, offline persistence, real Firebase project, server code, copying mockup HTML.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| First open | no Categories | empty state "Nothing here yet" + filled "New category" button, no FAB | N/A |
| Loading | status loading | skeleton rows 72 px | N/A |
| Load fails | backend rejects | error text and Retry button | status `error`, retry reloads |
| Create | "  Books " | Category "Books", State Label "Done", Reportable off, listed | N/A |
| Empty name | "   " | rejected inline, dialog stays open | no write |
| Duplicate | "books" when "Books" exists | inline duplicate error | no write |
| Write fails/times out | backend rejects or 10 s | dialog stays open with error text, list unchanged | `error(code)` |
| Search | "bo" | in-memory name filter, case-insensitive | N/A |
| Open | tap card | `/c/:id` with name header, back arrow, empty-category text | N/A |
| Unknown id | `/c/nope` | redirect to `/categories` | N/A |
| Session change | sign out / other user | store cleared, in-flight results discarded | N/A |

</frozen-after-approval>

## Code Map

- `src/app/domain/category.ts` -- `Category {id,name,stateLabel,reportable}`, `DEFAULT_STATE_LABEL`, `normalizeName`, `validateName(name, existing)`, `progress(done,total)`; pure
- `src/app/core/data/category-backend.ts` -- abstract `CategoryBackend` (`list(uid)`, `create(uid, data)`), `FirestoreCategoryBackend` (only Firebase here, maps error codes), pure `toDoc/fromDoc`
- `src/app/core/data/category.store.ts` -- `CategoryStore`: `status`, `categories`, `add`, `reload`, `byId`; reacts to `SessionState`
- `src/app/app.config.ts` -- provide `CategoryBackend`
- `src/app/features/categories/*` -- list component, new-category dialog component
- `src/app/features/items/*` -- `/c/:categoryId` screen and `categoryGuard`
- `src/app/app.routes.ts`, `src/app/shared/strings.ts`, `src/styles.css`
- `tests/rules/firestore.rules.spec.ts` -- add the app's exact category shape
- Reuse: `SessionState`, `LanguageService`, `SnackbarService`; do not change `SessionScope`, shell, auth files.

## Tasks & Acceptance

**Execution:**
- [x] `domain/category.ts` + spec -- model and validation
- [x] `core/data/category-backend.ts`, `category.store.ts` + specs (fake backend, fake timers for timeout) -- store
- [x] `strings.ts`, `styles.css`, `app.config.ts` -- text (en/it), tokens, provider
- [x] `features/categories/*` + specs -- list, empty, skeleton, search, dialog
- [x] `features/items/*`, `app.routes.ts` + specs -- Category screen and guard
- [x] `tests/rules` -- app-shaped create passes, cross-user denied
- [x] Verify: `npx ng build`, `npm run check`

**Acceptance Criteria:**
- Given a new User, when `/categories` opens, then the empty state and filled button show and no FAB.
- Given a valid unique name, when submitted, then the Category appears with State Label "Done" and Reportable off only after the write is confirmed.
- Given Categories, when a card is tapped, then `/c/:id` opens with name and back arrow; an unknown id redirects to `/categories`.
- Given the emulator rules, then an app-shaped Category passes and another User cannot read it.

## Implementation Notes

Implemented by subagent; domain, store/backend, list, dialog, items screen, guard, rules test. Not checked in a browser; FirestoreCategoryBackend only covered via pure mapping and the rules test.

## Spec Change Log

## Review Triage Log

- patch (low): uniqueness not NFC-normalized; Firestore cancelled/aborted/resource-exhausted fell to unknown; add allowed while store not ready (duplicate check on incomplete list); name input maxlength 120 vs limit 60 -- fixed.
- defer (low/medium): timed-out write may commit later and a retry duplicates (known, AD-5 re-read); no timeout on load; add confirmed during an in-flight reload may vanish until next reload; dialog focus restore/Shift+Tab/busy focus escape untested; ItemsComponent has no fallback if the Category disappears; accents-insensitive search; FAB overlap, shared button CSS, dark tokens for --scrim; skeleton announcement.
- false: guard redirects on load error -- the home screen shows the error with Retry; session-token same-uid re-sign-in -- signedOut passes through the effect and bumps the token.

## Design Notes

Decisions without the user (keep the product small): hand-built dialog (no Material, `*Intl` deferral stays open); domain Category omits timestamps (sorted by name, no Date use per AD-15); store tracks its own load token per session change instead of reading `SessionScope` epoch, equivalent and order-independent; no FAB when empty, FAB when non-empty; a timed-out offline write may still commit later (AD-5 re-read deferred).

## Verification

**Commands:**
- `npx ng build` -- expected: success
- `npm run check` -- expected: pass
