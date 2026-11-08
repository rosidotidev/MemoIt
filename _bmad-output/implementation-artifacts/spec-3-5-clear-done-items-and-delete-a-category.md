---
title: '3-5 Clear Done Items and delete a Category'
type: 'feature'
created: '2026-11-06'
status: 'done'
baseline_commit: '37a9fa660efd3e4ebd997d7d259616a749d17341'
route: 'dispatch'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-3-context.md']
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A Category cannot be reset or removed.

**Approach:** Category settings gets a danger zone with "Clear done items" and "Delete category", each behind the shared confirm dialog naming the Category and the count. Items are deleted in batches of at most 500; the Category document goes last, and only after that does the User leave for /categories.

## Boundaries & Constraints

**Always:** Signals change only after each batch or delete is confirmed; 10 s timeout per call; session changes discard results; failures show the form's inline error and keep the User on the screen; strings in en and it; no Cloud Functions.

**Never:** Actions on the Items list screen; undo; snackbar for delete; Cloud Functions; Notifications.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected | Error Handling |
|---|---|---|---|
| Dialog count shrinks while batches run (blind, edge) | medium | patch: count and name snapshotted on open |
| `{count}` in a Category name garbles text (blind) | low | patch: single-pass replace |
| Save during a danger action (blind, edge) | medium | patch: save ignored while working |
| Missing tests: timeout and session change on Category delete, session mid-batch, Clear failure and snackbar (gap) | medium | patch: tests added |
| Items unloaded or created elsewhere are orphaned on Category delete | medium | defer |
| Timed-out batch may still commit; state stale until reload | low | defer |
| Done label ignored in strings, stateLabel interpolation | low | defer |
| removeMany does not enforce 500; shared fake category backend; danger zone styling; destroyed component; blank flash | low | defer/reject |
| Clear done | Category with Done Items | dialog names Category and count; Done Items deleted; stays on settings | inline error, Items kept |
| Clear done, none Done | 0 Done | button disabled | N/A |
| Delete category | confirm | Items deleted in batches, then Category; signals updated; routes to /categories | inline error; Category stays with fewer Items; retry finishes |
| > 500 Items | 520 Done | batches of 500 and 20 | failure in batch 2 leaves 20 |
| Single Done Item | edit form | existing "Delete item" (3.4) works on Done Items too | N/A |

</frozen-after-approval>

## Code Map

- `core/data/item-backend.ts` -- `removeMany` (writeBatch); fake logs `batches`, `failBatch`.
- `core/data/item.store.ts` -- `removeDone`, `removeAll`, shared batched `removeIds`, `BATCH_SIZE`.
- `core/data/category-backend.ts`, `category.store.ts` -- `remove`; store deletes Items via ItemStore first.
- `features/category-settings/*` -- danger zone, shared `ConfirmDialogComponent`; `shared/strings.ts` en and it.
- Tests: `item-store-clearing.spec.ts`, `category-remove.spec.ts`, `category-settings-danger.spec.ts`.

## Tasks & Acceptance

**Execution:**
- [x] backend + fakes, ItemStore and CategoryStore methods, danger zone UI, strings, tests

**Acceptance Criteria:**
- Given Category settings, when the User confirms Clear done items, then only that Category's Done Items are deleted in batches of at most 500 and the User stays.
- Given Delete category confirmed, then Items go first, then the Category, then the User is on /categories; a midway failure leaves fewer Items and a retry completes.
- Given the Items list screen, then none of these actions appear.

## Implementation Notes

Decisions without the user: single Done Item clear is the existing edit-form Delete (3.4), no new row menu (smallest product); Clear done is disabled at zero Done Items; count text is "(N)" to avoid plural handling; `removeMany` is one atomic batch per call, the store chunks at 500; the Category delete also removes Open Items. Surprise: `CategoryStore` now depends on `ItemStore`, so specs that build it provide an ItemBackend.

## Spec Change Log

## Review Triage Log

| Finding | Verdict | Route / evidence |
|---|---|---|

## Verification

**Commands:**
- `ng build` and `npm run check` -- expected: pass
