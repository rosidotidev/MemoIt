---
title: '3-2 Edit an Item'
type: 'feature'
created: '2026-11-06'
status: 'done'
route: 'dispatch'
baseline_commit: '1cfe6a3f830015ff2903c75b62aab9a332d757a4'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Items can be added but not corrected.

**Approach:** Each Item row gets an edit icon (the row itself is not a target yet) leading to `/c/:categoryId/i/:itemId`, which reuses `ItemFormComponent` with the stored values. `ItemStore.update` writes Title and Description, preserving `createdAt`; the list reflects it and the User returns to the Items screen. An unknown Item id (or one in another Category) redirects to the Category.

## Boundaries & Constraints

**Always:** Signal changes only after the backend confirms; 10 s write timeout; failed save shows an inline error and keeps the typed text; edit drafts are separate from the new-Item draft and dropped after save, Cancel or sign-out; text from `strings`.

**Never:** Delete (3.4), toggle Done (3.3), Priority/Deadline fields, listeners.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected | Error Handling |
|---|---|---|---|
| Rules test for partial update missing | high | patch: emulator test added (allow, deleteField, createdAt kept, other user denied) |
| Stale snapshot in update overwrites live done/priority | medium | patch: merge on the live item inside the signal update |
| Edit draft leaks into new-Item draft when stored Item vanishes | medium | patch: handlers ignore input without stored Item |
| Cancel during in-flight save | low | patch: Cancel ignored while busy |
| Draft-drop test could not detect a missing drop | medium | patch: types untrimmed text, asserts normalized |
| Guard treats load error like unknown id | low | defer: lands on Category, which shows retry |
| Session-change branch of update untested; weak deleteField assertion | low | defer |
| Aria label concatenation, shared CSS file, Italian strings untested | low | defer to 6.1 / 7.1 |
| Generic unknown error when Item vanished mid-edit | low | defer |
| Save change | new Title | list updated, back to Items | N/A |
| Blank Description | "" | description field removed | N/A |
| Empty Title | "  " | inline `empty`, no write | draft kept |
| Backend fails | network | inline error, text kept | draft kept |
| Unknown id | /c/k1/i/nope | redirect /c/k1 | N/A |

</frozen-after-approval>

## Code Map

- `core/data/item-backend.ts`, `item.store.ts` -- `update`, `toUpdateDoc` (partial `updateDoc`, `deleteField` for blank description), `byId`.
- `core/state/draft.store.ts`, `domain/item.ts` -- drafts keyed by Category or Category/Item; `itemId` on the draft.
- `features/item-edit/item-edit.component.*`, `item.guard.ts`, `app.routes.ts` -- page, guard, route.
- `features/items/items.component.*` -- edit icon (48 px) per row; `strings.ts`.

## Implementation Notes

Decision: partial `updateDoc` instead of full-document `setDoc`, so createdAt, done, priority and the future deadline/value stay as stored (epic context says full documents; this keeps Epics 4-5 fields safe). Rules tested in the emulator.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route / evidence |
|---|---|---|

## Verification

**Commands:**
- `ng build` and `npm run check` -- expected: pass
