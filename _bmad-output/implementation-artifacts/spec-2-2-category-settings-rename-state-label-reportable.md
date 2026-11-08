---
title: '2-2 Category settings: rename, State Label, Reportable'
type: 'feature'
created: '2026-11-06'
status: 'done'
baseline_commit: 'c89316438b66636b1f057eba959fb8cfc618da48'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-2-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-2-1-create-and-list-categories.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A Category cannot be renamed, cannot get its own Done wording and cannot be marked Reportable; there is no menu on the Category screen (FR4, UX-DR11).

**Approach:** Add `CategoryStore.update` over `CategoryBackend.update`, a menu on the Category screen leading to `/c/:categoryId/settings`, and a Category settings screen (name, Done label with suggestions and live preview, Reportable switch, at-a-glance panel) with an explicit Save.

## Boundaries & Constraints

**Always:** Layers per AD-1 (only `core/data` imports Firebase). Standalone, OnPush, signals, prefix `memo-`, specs next to files. All text from `strings.ts` (en and it). Colors from tokens; targets at least 48 px. Name rules as in 2.1 (trimmed, 1 to 60, unique case-insensitive among the OTHER Categories). State Label trimmed, 1 to 16 chars. Save writes the full resulting document: `createdAt` untouched, `updatedAt` = `serverTimestamp()` (backend uses `updateDoc` with `name, stateLabel, reportable, updatedAt`, because the client model holds no timestamps; the rules see the full merged document). Store `update(id, patch)` returns `{ok:true, category}` or `{ok:false, error}`; same 10 s timeout, same session-token discard; signal changes only after confirmation, so Category screen and home list show the change at once. Typed values stay on error. Back arrow returns to `/c/:id`. Turning Reportable off touches no Item data (none exists yet).

**Never:** Danger zone (clear Done, delete Category), Items, Item counts other than 0, realtime listeners, copying mockup HTML, server code, real Firebase project.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Open settings | menu, Category settings | `/c/:id/settings` with current values | unknown id: redirect to `/categories` |
| Rename | "Novels" | saved, header and list show it | N/A |
| Duplicate name | other Category's name, any case | inline duplicate error | no write |
| Own name, other case | "books" for "Books" | allowed | N/A |
| Empty name / label | blank | inline error | no write |
| Label too long | 17 chars | inline error (input also has maxlength 16) | no write |
| Suggestion | tap "Bought" | label field = Bought, preview updates | N/A |
| Reportable toggle | on then Save | `reportable` true stored | N/A |
| Save fails | backend rejects or 10 s | inline error, values kept, list unchanged | `error(code)` |
| No change | Save without edits | still saves (updatedAt) or no-op; no error | N/A |

</frozen-after-approval>

## Code Map

- `src/app/domain/category.ts` -- add `STATE_LABEL_MAX`, `validateStateLabel`, `validateName(name, existing, exceptId?)`, `UpdateError`, `UpdateResult`, `STATE_LABEL_SUGGESTIONS`
- `src/app/core/data/category-backend.ts` -- abstract `update(uid, id, data)`; Firestore impl with `updateDoc`; pure `toUpdateDoc`
- `src/app/core/data/category.store.ts` -- `update(id, patch)`
- `src/app/features/items/items.component.*` -- header menu with one item
- `src/app/features/category-settings/*` -- settings component
- `src/app/app.routes.ts`, `src/app/shared/strings.ts`
- Fakes in existing specs implementing `CategoryBackend` need `update`
- `tests/rules/firestore.rules.spec.ts` -- app-shaped update passes (check existing)
- Reuse: `categoryGuard`, `SnackbarService`, `LanguageService`; do not change `SessionScope`, shell, auth.

## Tasks & Acceptance

**Execution:**
- [x] `domain/category.ts` + spec -- validation and types
- [x] `category-backend.ts`, `category.store.ts` + specs -- update path
- [x] `strings.ts`, `app.routes.ts` -- text (en/it), route with `categoryGuard`
- [x] `features/items/*` + spec -- menu to settings
- [x] `features/category-settings/*` + spec -- screen
- [x] Verify: `npx ng build`, `npm run check`

**Acceptance Criteria:**
- Given the Category screen, when the menu item is chosen, then `/c/:id/settings` opens and the back arrow returns to `/c/:id`.
- Given valid edits, when Save is confirmed, then the Category screen and home list show them and the saved doc keeps `createdAt`.
- Given a duplicate name or failed save, then an inline error shows and typed values stay.

## Implementation Notes

Implemented by subagent; patched after review. Not checked in a browser; FirestoreCategoryBackend.update covered only via pure mapping and the rules test. At-a-glance counts are a constant 0 until Epic 3. Italian wording fixed to un'etichetta.

## Spec Change Log

## Review Triage Log

- patch (medium): menu link built from `category()?.id` could throw when the Category vanishes; real route `/c/:id/settings` and menu Escape/outside-click had no test; hardcoded shadow colour -- fixed (guard, tests, `--scrim`).
- defer (low): form not resynced if the route param changes in place; `notFound` on save does not redirect and Firestore `not-found` maps to unknown; backend `invalid` always shown under the name field; maxlength (UTF-16) vs code-point validation; Save with no changes still writes; menu focus/arrow keys; focus-visible styles, live regions, saving announcement; suggestions not localized; timed-out write may commit later (already deferred in 2.1); rules tests for createdAt change.
- false/accepted: placeholder counts of 0 are intentional until Epic 3.

## Design Notes

Decisions without the user: explicit Save button (mockup) instead of autosave; `updateDoc` instead of `setDoc` for createdAt preservation; at-a-glance panel shows counts as 0 and the State Label; menu is a minimal hand-built popup with one item.

## Verification

**Commands:**
- `npx ng build` -- expected: success
- `npm run check` -- expected: pass
