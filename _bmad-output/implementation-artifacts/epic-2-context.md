# Epic 2 Context: Categories

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

A signed-in User can create Categories, see them on the home screen, open one and manage its name, State Label and Reportable flag. This gives the User the containers that every later Item, Deadline and Report hangs on.

## Stories

- Story 2.1: Create and list Categories
- Story 2.2: Category settings: rename, State Label, Reportable

## Requirements & Constraints

- A Category has a non-empty name, unique per User (trimmed, case-insensitive). State Label defaults to "Done" (1 to 16 characters) and Reportable defaults to off. A new User starts with no Categories.
- Opening a Category shows its Items. Until Epic 3 fills it, it shows a header with name, back arrow and the empty-category state.
- Category management (rename, State Label, Reportable) is never shown on the Item list screen. Clear Done and delete Category come later, in Epic 3.
- Turning Reportable off must not touch stored Item Values.
- A User reads and writes only their own data (enforced by Firestore rules from Epic 1).
- A connection is required. A failed or timed-out write shows an inline error, queues nothing, and keeps typed values.
- Accessibility: 48 px targets, 72 px rows, dialogs trap and restore focus. UI text follows the voice rules: short, plain, no exclamation marks or emoji.

## Technical Decisions

- Data: `users/{uid}/categories/{id}` with fields `name`, `stateLabel`, `reportable`, `createdAt`, `updatedAt`. Shape lives in `domain/category.ts`. Absent values are absent fields. Derived counts and progress are never stored.
- `CategoryStore` (`core/data`) loads the whole collection once into a signal with `status` `loading | ready | error`. Only it may import `firebase/*`. It owns `toDoc`/`fromDoc`.
- Mutations (`add`, `update`) return `ok` or `error(code)` with code in `network | timeout | permission | invalid | unknown`. The signal updates only after the confirmed write. Writes are raced against a 10 s timeout with rollback.
- Writes are full documents via `setDoc` (no merge). `createdAt` is preserved on edit and `updatedAt` is set.
- Name uniqueness is checked only in the client store. Rules cannot enforce it.
- Every read and write carries the session epoch and is discarded if it changed.
- Validation lives in `domain/validation.ts`, shared with the rules tests. Rules limit name to 1-60 characters and `stateLabel` to 1-16.
- Routes (table in `shell`): `/categories`, `/c/:categoryId`, `/c/:categoryId/settings`. A guard redirects a malformed or unknown id to `/categories`.
- Feature folders: `features/categories`, `features/category-settings`. Standalone, OnPush, signals. Selectors are prefixed `memo-`.
- All UI text goes in the typed `shared/strings.ts` (`it` and `en`). No literal text in templates. Colors come from tokens only.
- Mockups (`categories.html`, `category-settings.html`) are a layout reference only. Never copy their code or sample data.
- Search by Category name filters in memory.

## UX & Interaction Patterns

- Home: greeting, search, summary card, Due soon strip, Category cards with progress and an open-count badge (none when zero). Empty state "Nothing here yet" with a filled "New category" button and no FAB. Loading shows 72 px skeleton rows.
- New Category dialog: inline errors for an empty or duplicate name.
- Tapping a card opens `/c/:categoryId`. The menu there leads to Category settings, and the back arrow returns to the Category.
- Category settings: name, Done label with suggestions (such as Bought, Read) and a live preview, Reportable switch, and an at-a-glance panel. Changes show immediately on the Category screen and the home list. No danger zone yet.

## Cross-Story Dependencies

- 2.2 builds on the Category screen shell and the store from 2.1.
- Depends on Epic 1 (auth, session scope, guard, Firestore rules and emulator tests).
- Epic 3 later fills the Category screen, adds the danger zone (clear Done, delete Category) to settings, and supplies Items for progress and counts, which are 0 until then.
- Epic 5 adds Values, which relate to the Reportable toggle.
