---
title: '3-4 Delete an Item'
type: 'feature'
created: '2026-11-06'
status: 'done'
baseline_commit: '97217ff2bc9f282a03b3f14daa54aa9d5e772335'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** An Item cannot be removed.

**Approach:** The edit screen gets a "Delete item" text button (absent in the new-Item form). It opens a reusable confirm dialog naming the Item and saying it cannot be undone, with a destructive error-colored text button. On confirm, `ItemStore.remove(id)` deletes the document physically; the signal drops the Item only after the backend confirms; the User returns to the Items screen. A failure shows an inline error and keeps the Item.

## Boundaries & Constraints

**Always:** Dialog is modal, traps focus, closes on Escape or Cancel, restores focus, ignores dismissal while busy; text from `strings` (en and it); `remove` returns `ok` or `error(code)`; 10 s timeout; discard results from a previous session; drop the Item draft after confirmed delete; deleting an already missing Item counts as ok (Firestore delete is idempotent).

**Never:** Clear done (3.5), Category delete, delete from the Items list, undo for delete, snackbar for delete, Cloud Functions.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected | Error Handling |
|---|---|---|---|
| `$` patterns in title garble the dialog text (blind, edge) | medium | patch: function replacer |
| Delete while toggle in flight; Save during delete (blind, edge) | medium | patch: remove ignored while in flight; save blocked and form busy while deleting |
| Success after session change untested (gap) | medium | patch: test added |
| Timed-out delete may land later, item stays until reload | low | defer |
| Dialog: Tab/Escape when busy or scrim focused, hard-coded ids, inert background, focus restore checks | low | defer (7.1) |
| Session-change error shown inline; destroyed-while-pending navigates; idempotent missing-doc not reachable; delete-specific error copy; css placement; extra tests | low | defer/reject |
| New form | `/c/:id/i/new` | no Delete button | N/A |
| Edit form | existing Item | "Delete item" button below the form | N/A |
| Open dialog | tap Delete item | dialog names the Item, "cannot be undone", Cancel and destructive Delete | N/A |
| Dismiss | Escape, Cancel or scrim | dialog closes, Item kept, focus back on Delete button | ignored while busy |
| Confirm | tap Delete | Item gone from signal and list, navigates to `/c/:id` | N/A |
| Failure | network, timeout, permission | dialog closes, inline error shown under the form, Item kept | code mapped to string |
| Unknown id / store not ready | | `error: unknown`, no change | N/A |
| Session change mid-delete | | result discarded, `error: unknown` | N/A |

</frozen-after-approval>

## Code Map

- `core/data/item-backend.ts` -- add abstract `remove(uid,id)` (`deleteDoc`, mapped errors).
- `core/data/item-backend.testing.ts` -- fake `remove`: `removeError`, `hang`, `removed` log; drops from `stored`.
- `core/data/item.store.ts` -- `remove(id)`: guards like `update`, `withTimeout`, `sessionToken`; filters the signal after success; clears in-flight/stale flags for the id.
- `shared/confirm-dialog.component.*` -- new reusable dialog (inputs `heading`, `body`, `confirmLabel`, `cancelLabel`, `busy`; outputs `confirmed`, `cancelled`); copy focus-trap pattern of `features/categories/new-category-dialog.component.*`; 3.5 will reuse it.
- `features/item-edit/item-edit.component.*` -- Delete button, dialog, `remove` flow, error shown via the form's `error` input.
- `shared/strings.ts` -- `itemForm.delete`, `deleteTitle`, `deleteBody` (cannot be undone), `deleting`; en and it.
- Rules already allow owner delete; `tests/rules` already covers owner and cross-user item delete: no change.

## Tasks & Acceptance

**Execution:**
- [x] backend + fake -- `remove`
- [x] `ItemStore.remove` + unit tests (ok, failure keeps Item, timeout, unknown id, session change)
- [x] `ConfirmDialogComponent` + tests (Escape, Cancel, focus restore, busy)
- [x] Edit screen Delete flow, strings, component tests (absent in new form, dialog text, cancel keeps, confirm removes and navigates, failure shows error)

**Acceptance Criteria:**
- Given the edit form, when the User chooses Delete item, then a confirm dialog names the Item and says it cannot be undone, with a destructive error-colored text button; Escape or Cancel dismisses; the button is absent in the new form.
- Given the User confirms and `ItemStore.remove` succeeds, then the Item is gone from the signal and list and the User is back on the Items screen.
- Given the delete fails, then an inline error shows and the Item stays.

## Implementation Notes

Decisions made without the user (smallest product): confirm dialog is a shared component for reuse in 3.5; failure closes the dialog and reports through the form's existing inline error region; no snackbar.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route / evidence |
|---|---|---|

## Verification

**Commands:**
- `ng build` and `npm run check` -- expected: pass
