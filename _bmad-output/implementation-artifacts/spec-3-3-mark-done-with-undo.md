---
title: '3-3 Mark Done with Undo'
type: 'feature'
created: '2026-11-06'
status: 'done'
route: 'dispatch'
baseline_commit: '61307274d91e944764a0d294299c495d20429a9b'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Items cannot be ticked off.

**Approach:** The whole Item row (except the edit icon) toggles Done through `ItemStore.toggleDone`, which is optimistic: the signal flips at once, the write follows, and on failure the state rolls back with a visible error. A snackbar names the Item with the Category's State Label and offers Undo, which is another `toggleDone`. After a timed-out write, the next write to that document first re-reads it with `getDocFromServer` (AD-5).

## Boundaries & Constraints

**Always:** Row exposes `aria-pressed`; Done rows show a filled check and strikethrough and sit in the Done section; progress ring updates from the signal; 10 s write timeout; one snackbar at a time, 5 s, polite live region; partial `updateDoc` of `done` and `updatedAt` only; text from `strings`; ignore a toggle while the same Item has a write in flight; discard results from a previous session.

**Never:** Delete (3.4), clear done (3.5), moving Items, listeners, offline queue, any Cloud Function.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected | Error Handling |
|---|---|---|---|
| Re-read result only null-checked, not applied (blind, edge) | medium | patch: fresh state now drives next value and signal; test added |
| Re-read null leaves deleted Item and stale flag (all three) | medium | patch: Item dropped, flag cleared; test added |
| Undo is a relative toggle (blind, edge) | medium | patch: Undo runs only if the Item still holds the toggled value |
| Snackbar Undo unclickable (pointer-events) | false | `.snack` sets pointer-events:auto, button inherits |
| Real Firestore fetch/setDone untested; session change during re-read untested | low | defer |
| Focus lost on row move; snackbar no pause/5 s; string concatenation word order; network-coded queued write; undo ignored feedback; CSS magic numbers; fake not mutating | low | defer |
| Mark done | tap open row | row in Done section at once, snackbar "<Title> marked <State Label>" with Undo | N/A |
| Reopen | tap Done row | back in Open, snackbar "<Title> reopened" with Undo | N/A |
| Undo | tap Undo | previous state restored and persisted | N/A |
| Write fails | network | state rolled back, snackbar with error text, no Undo | rollback only if state still equals the optimistic value |
| Timeout | no answer 10 s | rollback, error; next write to that Item first re-reads from server | re-read failure maps to its code and aborts the write |
| Double tap in flight | same Item | second tap ignored | N/A |
| Unknown id / loading | not ready | `error: unknown`, no change | N/A |

</frozen-after-approval>

## Code Map

- `core/data/item-backend.ts` -- add `setDone(uid,id,done)` (updateDoc `{done, updatedAt}`) and `fetch(uid,id)` (`getDocFromServer`, `fromDoc`, null when missing); `toDoneDoc`.
- `core/data/item-backend.testing.ts` -- fake `setDone`/`fetch` with errors, hang, call log.
- `core/data/item.store.ts` -- `toggleDone(id)`, stale-id set for AD-5; reuse `withTimeout`, `toCode`, `sessionToken`.
- `shared/snackbar.service.ts`, `snackbar.component.ts` -- optional action (label + callback), replaces previous message.
- `features/items/items.component.*` -- row becomes a toggle button (`aria-pressed`) next to the edit link; strikethrough; handler shows snackbar.
- `shared/strings.ts` -- `category.markedDone`, `reopened`, `undo`, `toggleError` in `en` and `it`.
- `firestore.rules` tests (`rules/`) -- done toggle allowed, other user denied.

## Tasks & Acceptance

**Execution:**
- [x] backend + fake -- `setDone`, `fetch`
- [x] `ItemStore.toggleDone` + unit tests (optimistic, rollback, timeout then re-read, in-flight ignore, session change)
- [x] Snackbar action + tests
- [x] Items row toggle, strings, component tests (aria-pressed, section move, undo, error)
- [x] Rules test for done toggle

**Acceptance Criteria:**
- Given an open Item, when the User taps its row, then the signal updates before the write resolves, the row moves to Done with check and strikethrough, a snackbar offers Undo, and the ring updates.
- Given the write fails or times out, when the result arrives, then the state rolls back and an error is shown; after a timeout the next write to that document first calls `getDocFromServer`.
- Given a Done Item or Undo, when tapped, then the Item returns to Open and the state persists.

## Implementation Notes

Decisions made without the user (smallest product): Undo is a snackbar action wired in the Items screen; the error uses the snackbar (no new region); one in-flight toggle per Item.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route / evidence |
|---|---|---|

## Verification

**Commands:**
- `ng build` and `npm run check` -- expected: pass
