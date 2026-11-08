# Epic 3 Context: Items

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A User can capture, consult, tick off, edit and delete Items inside a Category, and clean up Categories (clear Done Items, delete a Category). The list can be searched, filtered and sorted, and shows alongside the Category list on wide screens. This is the core daily-use loop of the app: capturing an Item must take about 10 seconds on a phone.

## Stories

- Story 3.1: Add an Item and see the list
- Story 3.2: Edit an Item
- Story 3.3: Mark Done with Undo
- Story 3.4: Delete an Item
- Story 3.5: Clear Done Items and delete a Category
- Story 3.6: Search and filter chips
- Story 3.7: Sort Open Items (Should)
- Story 3.8: Two-pane Items layout

## Requirements & Constraints

- Item has a required Title (1-120 chars) and optional Description (max 4000); no custom per-Category fields. A new Item appears within 1 s of saving.
- Tapping an Item row toggles Done/open with a short-lived Undo; the toggle must show in under 100 ms. Done Items show a check and strikethrough, sit at the bottom, persist across sessions and devices, and use the Category's State Label wording in text.
- Item deletion is physical, after a confirmation dialog.
- Category management (not on the Item list screen): clear Done Items (all, or a single one) after confirmation; delete Category with confirmation stating the Item count (hard cascade).
- Sort (Should): open Items by Newest first (default), Priority or Deadline; Done stay at the bottom; remembered per Category.
- A connection is required: a failed or timed-out write shows an inline error and nothing is queued.
- Accessibility: 48 px targets, 72 px rows, `aria-pressed` on rows, one polite live region for snackbars and save results, dialogs and sheets trap and restore focus and close on Escape, reduced motion respected.
- Voice: short, plain, no exclamation marks or emoji; confirmations name the thing. Cut from v1: moving an Item between Categories, "Done today", Remind me.
- Deadline, Priority and Value fields belong to Epics 4 and 5; here a new Item has Priority `medium`, no Deadline, no Value.

## Technical Decisions

- Items are a flat collection `users/{uid}/items/{id}` (auto ids), each with `categoryId`, `title`, `description` (absent when empty), `done`, `deadline` (absent when none), `priority` (`low|medium|high`), `value` (absent when none), `createdAt`, `updatedAt`. Absent means absent field, never `null` or `0`. Derived counts (open, overdue, progress) are computed in memory, never stored.
- Only `core/data` may import `firebase/*`. `ItemStore` and `CategoryStore` own `toDoc`/`fromDoc`; features read via signals and write via store methods only.
- Stores load the whole collection once into a signal keyed by id (`status` loading/ready/error); no realtime listeners, no offline persistence; reload on tab visibility after more than 60 s.
- Mutations (`add`, `update`, `remove`, `toggleDone`, `removeDone`) return `ok` or `error(code)` with code in `network|timeout|permission|invalid|unknown`; features map codes to strings, never raw Firebase text.
- Writes are full documents via `setDoc` without merge; `createdAt` preserved on edit; `updatedAt == request.time` per the rules.
- Signal updates only after a confirmed write, except `toggleDone`, which is optimistic, rolls back with a visible error on failure, and Undo is another `toggleDone`. Each write races a 10 s timeout; after a timeout the next write to that document first re-reads it with `getDocFromServer`. Every read/write carries the `sessionEpoch` and is discarded if stale.
- Cascade: `CategoryStore.remove(id)` deletes Items first in `writeBatch`es of at most 500, then the Category doc; returns `ok` only after the Category is gone; a midway failure leaves fewer Items and retry completes. `ItemStore.removeDone(categoryId)` batches the same way.
- One `ItemFormComponent` (in `shared`) and one `DraftStore` (`core/state`) serve new and edit at `/c/:categoryId/i/new` and `/c/:categoryId/i/:itemId`; the draft survives a failed save and is dropped after confirmed save, Cancel, delete or logout. `initialDraft(categoryId, item?)` lives in `domain/item.ts`; validation in `domain/validation.ts`, shared with the rules tests.
- Firestore rules enforce shape and that `categoryId` references an existing Category of the same user; Items written by the app must pass them.
- Routes: `/c/:categoryId` (Items), `/c/:categoryId/settings`, the two item routes above; a guard redirects a malformed or unknown id to `/categories` (unknown Item id redirects to its Category).
- View state (search chip choice, sort) is per device in `localStorage` keyed by uid and Category, never sent to Firestore.
- `LayoutService.windowClass` (compact under 768, medium 768-1199, expanded 1200+) is the only source for layout; no component measures the window. Two-pane starts at 1024 px.
- Conventions: standalone OnPush components with signals, zoneless-compatible; selectors prefixed `memo-`; all UI text in `shared/strings.ts` (typed `it`/`en`), no literal text in templates; colors from tokens only; `new Date`/`Intl.DateTimeFormat` only in `domain/time.ts` and `ClockService`; unit tests as `*.spec.ts` (Vitest), e2e in Playwright with axe.
- Mockups (`items.html`, `item-edit.html`, `category-settings.html`) are layout references only; their sample data and extras are not content.

## UX & Interaction Patterns

- Items screen: head card with progress ring, search field, chips (All, Overdue, High priority, Has deadline; exactly one active; the Done section is filtered too), Open section then Done section, empty-category state with "Add item", Add item FAB, 72 px skeleton rows while loading.
- Item row: 24 px round check; the whole row toggles Done; only the edit icon opens Item edit. Overdue and High chips (Epic 4) use fixed error/tertiary roles with the words "Overdue"/"High".
- Snackbar: 5 s, one line, optional Undo, polite live region, never stacks; it names the Item with the State Label.
- Item edit: panels Details and Category (read-only), live preview, inline save errors under the form, typed text kept on failure; Delete item present only when editing, never in the new form.
- Confirm dialog: names what is lost and how many, destructive text button in error color, Escape or Cancel dismisses, not used for undoable actions.
- Category settings danger zone holds Clear done items and Delete category; none of these actions appear on the Item list.
- Sort sheet: bottom sheet on compact, centered otherwise; selecting an option closes it; focus trapped and restored.
- Two-pane at 1024 px and up: Category list on the left with current one selected, Items on the right, back arrow hidden; below 1024 px single column with back arrow.

## Cross-Story Dependencies

- Depends on Epic 1 (rules, auth, session lifecycle, stores' session epoch) and Epic 2 (`CategoryStore`, Category cards, Category settings screen, State Label, `reportable`).
- 3.1 introduces `ItemStore`, `DraftStore`, `ItemFormComponent` and the Items screen; 3.2 to 3.8 build on them. 3.4 uses the edit form from 3.2. 3.5 extends Category settings from Epic 2 and uses `ItemStore` from 3.1. 3.6 and 3.7 add view state to the 3.1 screen; 3.8 changes its layout.
- 3.1 also makes the Epic 2 Category cards show real progress.
- Overdue and High-priority chips and Priority/Deadline sort yield empty or "missing sorts last" results until Epic 4 supplies those fields.
- Epic 5 adds the Value field to the same form for Reportable Categories.
