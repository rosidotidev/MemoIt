---
title: '3-1 Add an Item and see the list'
type: 'feature'
created: '2026-11-06'
status: 'done'
route: 'dispatch'
baseline_commit: '27f320f4789d6e96d84180755f2f4642b2b722e5'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A Category can be created but not filled: there is no Item model, store or form, and progress on the home cards is a hard-coded 0.

**Approach:** Add `domain/item.ts` + `domain/validation.ts`, an `ItemBackend`/`ItemStore` (load once, no listeners, 10 s write timeout, session token), a `DraftStore`, a shared presentational `ItemFormComponent` used by the page at `/c/:categoryId/i/new`, and make the Category screen show the head card with progress ring, Open and Done sections and the FAB. Home cards and settings counts use real Item counts.

## Boundaries & Constraints

**Always:** Full-document writes with `done:false`, priority `medium`, no deadline/value; Title 1..120 code points after trim, Description max 4000; draft survives a failed save and is dropped after save, Cancel or sign-out; user-visible text from `strings`; Firebase imported only in `core/data`.

**Never:** Edit/done/delete/sort/search (3.2+), deadline/priority UI, listeners, custom fields, Material components.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected | Error Handling |
|---|---|---|---|
| Save valid | Title "Milk" | Item at top of Open, draft dropped, navigate to Category | N/A |
| Empty title | "   " | rejected inline `empty` | draft kept |
| Backend fails | network error | inline error, values kept | draft kept |
| Items not loaded | status loading/error | skeleton / retry on Category screen | save refused `unknown` |

</frozen-after-approval>

## Code Map

- `src/app/core/data/category.store.ts`, `category-backend.ts` -- pattern to mirror (token, withTimeout, fakes).
- `src/app/features/items/items.component.*` -- Category screen to extend.
- `src/app/features/categories/categories.component.ts` -- cards progress; `category-settings.component.*` -- counts.
- `firestore.rules` -- `validItem` already exists and is tested; unchanged.

## Tasks & Acceptance

**Execution:**
- [ ] `domain/item.ts`, `domain/validation.ts` -- Item types, initialDraft, validateTitle/Description, sort, counts
- [ ] `core/data/item-backend.ts`, `item.store.ts` -- Firestore items list/create; store
- [ ] `core/state/draft.store.ts` -- per-Category drafts, reset on session change
- [ ] `shared/item-form.component.*` -- presentational form with live preview
- [ ] `features/item-edit/item-new.component.ts` -- route page
- [ ] `features/items/items.component.*`, `categories`, `category-settings`, `app.routes.ts`, `app.config.ts`, `strings.ts` -- wiring
- [ ] specs for each new unit

**Acceptance Criteria:**
- Given a Category, when the User saves a valid Title, then the Item appears first in Open and the draft is gone.
- Given the Category screen, then head card ring, Open, Done sections and empty state render; home cards show real progress.

## Implementation Notes

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route / evidence |
|---|---|---|
| Glance counts, head-sub, Done heading, skeleton untested (verification-gap) | medium | patch: tests added |
| categories spec shared itemBackend leaks on failure | low | patch: afterEach reset |
| Draft not rehydrated across navigation untested | low | defer |
| Timed-out write may commit later, retry duplicates (edge, blind) | medium | defer: same as Category, offline cut in v1 |
| createdAt Date.now() vs server timestamp skew (edge, blind) | low | defer |
| reload during add can drop new Item (edge) | low | defer: narrow window |
| New-item form saves while store loading/error gives generic error (edge, blind) | low | defer |
| Home cards 0% while Items loading/error (edge) | low | defer |
| Progress summary hard-codes word order (blind) | low | defer to epic 6 i18n |
| titleMax/descriptionMax unused, no maxlength (blind) | low | defer |
| Add catch branch ignores stale token (edge) | low | defer |
| a11y nits: three alerts, focus on invalid, FAB overlap (blind) | low | defer to 7.1 |
| "No Firestore rules for items" (blind) | false | rules validItem exist in firestore.rules and are tested (unchanged) |
| categoryId not checked in client add (blind) | false | rules check exists(); guard checks on route |
| Missing FirestoreItemBackend emulator test | medium | defer: retro action 2, pattern for 3.2 |
| fromDoc turns corrupt docs into blanks; no pagination; no updatedAt (blind) | low | defer |

## Verification

**Commands:**
- `ng build` and `npm run check` -- expected: pass
