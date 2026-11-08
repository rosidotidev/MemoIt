---
status: final
stepsCompleted: [1, 2, 3, 4]
inputDocuments:
  - _bmad-output/planning-artifacts/prds/prd-bmad612_home-2026-11-06/prd.md
  - _bmad-output/planning-artifacts/prds/prd-bmad612_home-2026-11-06/addendum.md
  - _bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-11-06/ARCHITECTURE-SPINE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-11-06/DESIGN.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-11-06/EXPERIENCE.md
  - _bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-11-06/NAVIGATION.md
---

# MemoIt - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for MemoIt v1, decomposing the requirements from the PRD, the UX design contract (DESIGN.md, EXPERIENCE.md, NAVIGATION.md) and the Architecture Spine into implementable stories. Stories are numbered in dependency order: every story depends only on earlier ones. Story ids have the form `N.M`. Mockups are a composition reference, never source (AD-18).

Cut from v1 and not to be built: Notifications, "Remind me" and lead time, "Keep me signed in", moving an Item between Categories, "Done today", push, offline, password encryption. Installable PWA is Could.

## Requirements Inventory

### Functional Requirements

FR1: A User can log in with email and password and log out. Unauthenticated visitors see only the login screen, the session persists across restarts until logout, wrong credentials show an error and grant no access. No registration, no password-reset UI.
FR2: A User can read and write only their own Categories and Items. Firestore rules deny cross-user and unauthenticated access, proven by a rules test suite that exists before any feature stores real data.
FR3: A User can create a Category with a non-empty name (unique per User) and open it to see its Items. State Label defaults to "Done", Reportable defaults to off. A new User starts with no Categories.
FR4: A User can open Category management to rename the Category, set its State Label, toggle Reportable, clear Done Items (all or a single one) after confirmation, and delete the Category (explicit confirmation with the Item count, hard cascade). None of this appears on the Item list screen.
FR5: A User can add an Item with a required Title and an optional Description, and edit both later. A new Item appears within one second. No custom per-Category fields.
FR6: A User can toggle an Item Done and open again by tapping its row, with a short-lived Undo. Done Items show a check mark and strikethrough, move to the bottom, persist across sessions and devices and use the Category's State Label wording where text is shown.
FR7: A User can permanently delete an Item after a confirmation dialog (physical delete).
FR8: A User can set, change or clear a Deadline (date and time) and a Priority (low, medium default, high). Both are visible on the Item row; overdue open Items are visibly flagged; Deadlines are shown in device local time.
FR9: A User is alerted in the app within one minute when an open Item's Deadline arrives; when the app is opened after a Deadline passed the Item is flagged overdue and overdue Items are surfaced on the Category list. No alert for Done or deleted Items. Tapping the alert opens the Item. Nothing is sent outside the app.
FR10 (Should): A User can sort a Category's open Items by Priority or Deadline; Done Items stay at the bottom; the sort is remembered per Category.
FR11: A User can enter a numeric Value (decimals allowed, non-numeric rejected) on Items of a Reportable Category; the field appears only for Reportable Categories; turning Reportable off keeps stored Values.
FR12: A User can open a Report for a Reportable Category: one line chart of Values by Item date (Deadline else creation date) with weekly or monthly sum, period filter (3 months, 6 months, 1 year, all), a summary (latest, change, average, lowest) and an empty state when there are no Values.
FR13: A User can switch the UI language between Italian and English (default English); all UI text, including dates, follows it; the choice persists per User.
FR14: A User can select a color theme (light, dark, system) and an accent; the choice persists per User.

### NonFunctional Requirements

NFR1: Security rules are implemented and tested before any feature stores real data; cross-user access is rejected (SM-3).
NFR2: Mobile-first, responsive on tablet and desktop (compact, medium, expanded window classes).
NFR3: A new Item appears within 1 s of saving; the Done toggle shows in under 100 ms; capturing an Item takes under about 10 s on a phone.
NFR4: An in-app Deadline alert appears within one minute of the Deadline while the app is open.
NFR5: Accessibility floor: AA contrast (4.5:1 text, 3:1 graphics) in both schemes and for every accent, 48 px targets, 72 px rows, `aria-pressed`, polite live region, focus trap and restore, reduced motion, 200% text resize, every chart with a text alternative.
NFR6: A connection is required (no offline). A failed or timed-out write shows an inline error and nothing is queued.
NFR7: No server code of any kind (AD-3); local development against the Firebase Emulator Suite only.
NFR8: Descriptions may hold credentials in clear text, so access control rests on login and the Firestore rules.
NFR9: Numbers parse and format only through one module; no floating point drift in sums (AD-16).

### Additional Requirements

- Starter: greenfield Angular 22.2.x scaffold (standalone, OnPush, signals, zoneless-compatible), TypeScript ~6.0.3, Angular Material and CDK 22.2.6, firebase 13.2.0 (modular, no `@angular/fire`), Vitest, Playwright, ESLint with angular-eslint. Versions are reverified at scaffold (AR1).
- Repository under git from the scaffold; layout per the Structural Seed (features, shell, domain, core/state, core/data, shared, environments, tests/rules, e2e) (AR2).
- Two environments: `local` (Firebase Emulator Suite, Auth and Firestore, JDK 21+) and `prod` (gitignored config with committed example, prod build fails without it). `firebase.ts` connects to emulators only when `local` (AR3, AD-13).
- `npm run check` runs ESLint, unit tests and rules tests and is the only gate; `npm run deploy` runs it then deploys rules then Hosting. Deploy is never executed in this run (AR4, AD-13, AD-15).
- ESLint enforces: allowed-imports table, `firebase/*` only in `core/data`, no `new Date`/`Date.now`/`Date.parse`/`Intl.DateTimeFormat` outside `domain/time.ts` and `ClockService`, no Angular or DOM in `domain`, number formatting only in `domain/number.ts`, no literal UI text in templates (Vitest scan), no `functions/` directory (AR5, AD-15).
- Data model: `users/{uid}/categories/{id}`, `users/{uid}/items/{id}`, `users/{uid}/preferences/app`; full-document writes with `setDoc`; absent value is absent field; `createdAt` preserved; derived counts never stored (AR6, AD-2).
- Firestore rules authoritative on access and shape with emulator tests for every field, valid and invalid vectors shared with the client validators (AR7, AD-10, AD-16).
- Stores: load once into signals, `ok | error(code)` results, optimistic only for `toggleDone`, 10 s write timeout with rollback, session epoch tagging, reload on tab visibility after 60 s, no realtime listeners, no offline persistence (AR8, AD-5, AD-11).
- One session lifecycle: tri-state `AuthService`, `SessionScope` resets stores and local view state, one route guard (AR9, AD-11).
- Cascade delete of a Category through `CategoryStore.remove` in `writeBatch`es of at most 500; `ItemStore.removeDone` batched likewise; name uniqueness checked in the client (AR10, AD-6).
- `domain/time.ts`, `ClockService` (30 s tick and visibility refresh) own time and overdue (AR11, AD-4).
- `ReminderService` derives alerts, one per `(itemId, deadlineMillis)`, remembered in `sessionStorage` (AR12, AD-7).
- `domain/series.ts` builds Report series, gaps are absent never zero; Chart.js and ng2-charts loaded only with the lazy `/report` route (AR13, AD-8).
- `shared/strings.ts` typed `it`/`en` dictionary including Material `*Intl`; `<html lang>` follows Language (AR14, AD-9, AD-17).
- One accent drives the theme via `shared/theme.ts` (OKLCH tonal mapping), CSS custom properties on `<html>`, AA contrast unit test across presets in both schemes (AR15, AD-12).
- One `ItemFormComponent` and one `DraftStore` for new and edit (AR16, AD-14).
- Routes table in `shell` with a guard redirecting a malformed or unknown id to `/categories` (AR17).
- View state (sort, filters, Report period and aggregation) per device in `localStorage` keyed by uid and Category (AR18).
- Mockup extras and sample data are not content (AR19, AD-18).

### UX Design Requirements

UX-DR1: Login screen: split layout on expanded, tonal header on compact, password Show/Hide, sign-out confirmation snackbar "You have been signed out" (login.html).
UX-DR2: Navigation by window class: bottom bar under 768 px, rail 768 to 1199, drawer from 1200; three destinations Categories, Report, Settings; `aria-current`; Sign out also as last entry of rail and drawer.
UX-DR3: Account menu on every screen except Login: avatar opens name and email, Settings, Sign out (no confirmation); closes on outside tap, Escape, resize; focus restored.
UX-DR4: Categories home: greeting, search by Category name, summary card (overdue headline, open, due this week, categories), Due soon strip (overdue first, then soonest; hidden when empty), Category cards with progress and open-count badge (none when zero), empty state "Nothing here yet" with "New category", FAB hidden when empty.
UX-DR5: New Category dialog with name validation; unique-name error inline.
UX-DR6: Items screen: head card with progress ring, search and chips (All, Overdue, High priority, Has deadline; exactly one active; Done section filtered too), Open then Done sections, empty-category state with "Add item", skeleton rows at 72 px while loading, two-pane from 1024 px with back arrow hidden.
UX-DR7: Item row: 24 px round check, whole row toggles, only the edit icon opens Item edit, deadline chip outlined, Overdue chip in error container with the word "Overdue", High chip in tertiary container with the word "High".
UX-DR8: Sort sheet (Newest first default, Priority, Deadline), bottom sheet on compact, centered otherwise, applies to open Items only.
UX-DR9: Snackbar 5 s, one line, optional Undo, polite live region, never stacks.
UX-DR10: Item edit: panels Details, Priority tiles, When with quick chips (Today, Tomorrow, Next week, No deadline) plus date and time, read-only Category, live preview, Value panel only when Reportable, delete with confirmation (absent in new), inline save errors, typed text survives a failed save.
UX-DR11: Category settings: name, Done label with suggestions and live preview, Reportable switch, at-a-glance panel, danger zone with Clear done items and Delete category confirmations naming the count.
UX-DR12: Confirm dialog pattern: names what is lost and how many, destructive text button in error color, Escape or Cancel dismisses, never for undoable actions.
UX-DR13: Deadline alert banner at the top of any screen, one per Item and Deadline, auto-dismiss after 8 s, tap opens the Item.
UX-DR14: Report: summary card, period chips, weekly or monthly segmented switch, trend chart with text or table alternative, empty state explaining how to enable Reportable, link to the Category list.
UX-DR15: Settings: accent swatches (9 presets, 48 px, ring on selected) plus custom hue slider, appearance Light/Dark/System, language segmented button, live mini-app preview, no Save button, no notification settings.
UX-DR16: Voice: short, plain, no exclamation marks, no emoji; confirmations name the thing; Done wording uses the Category State Label.
UX-DR17: Accessibility floor verified with axe in the Playwright suite: focus ring 3 px primary, dialogs trap and restore focus, 48 px targets, reduced motion, 200% text.
UX-DR18: Tokens only in components; error, overdue and High colors never derive from the accent.

### FR Coverage Map

FR1: Epic 1 - Login, session persistence, guard, logout (stories 1.2, 1.3)
FR2: Epic 1 - Firestore rules and emulator tests (story 1.1)
FR3: Epic 2 - Create and list Categories, open one (story 2.1)
FR4: Epic 2 and Epic 3 - Rename, State Label, Reportable (2.2); clear Done and delete Category (3.5)
FR5: Epic 3 - Add and edit Item (3.1, 3.2)
FR6: Epic 3 - Toggle Done with Undo (3.3)
FR7: Epic 3 - Delete Item (3.4)
FR8: Epic 4 - Deadline and Priority (4.1)
FR9: Epic 4 - Overdue flagging and in-app alerts (4.2, 4.3)
FR10: Epic 3 - Sort sheet (3.7)
FR11: Epic 5 - Value entry (5.1)
FR12: Epic 5 - Report (5.2)
FR13: Epic 6 - Language (6.1)
FR14: Epic 6 - Theme and accent (6.2)
PWA (Could): Epic 7 (7.2)

## Epic List

### Epic 1: Secure foundation and sign-in
Bob can open a running, tested Angular app and sign in with an account created in the Firebase console, with Firestore rules and emulator tests in place before any real data exists.
**FRs covered:** FR1, FR2

### Epic 2: Categories
A signed-in User can create Categories, see them on the home screen, open one and manage its name, State Label and Reportable flag.
**FRs covered:** FR3, FR4 (part)

### Epic 3: Items
A User can capture Items, consult a Category, tick Items off with Undo, edit and delete them, clear Done Items, delete a Category, and filter and sort the list.
**FRs covered:** FR4 (part), FR5, FR6, FR7, FR10

### Epic 4: Deadlines, priority and reminders
A User can give an Item a Deadline and Priority, see overdue Items flagged, see what is due soon, and get an in-app alert when a Deadline arrives.
**FRs covered:** FR8, FR9

### Epic 5: Values and reports
A User can log numeric Values in a Reportable Category and read the trend in a Report.
**FRs covered:** FR11, FR12

### Epic 6: Personalization
A User can choose Italian or English and their own accent and appearance, kept across devices.
**FRs covered:** FR13, FR14

### Epic 7: Hardening and optional install
The whole app is verified end to end with accessibility checks, and (Could) can be installed to the home screen.
**FRs covered:** NFR5 verification; PWA (Could)

## Epic 1: Secure foundation and sign-in

Bob can open a running, tested Angular app and sign in, with Firestore rules and emulator tests in place before any real data exists.

### Story 1.1: Angular 22 scaffold and Firestore rules with emulator tests

As Bob, the builder,
I want a running Angular 22 project wired to the Firebase Emulator Suite, with Firestore security rules covered by emulator tests,
So that no real data is ever stored before isolation is proven.

**Acceptance Criteria:**

**Given** the repository is empty of app code
**When** the scaffold is created
**Then** an Angular 22.2.x standalone app with TypeScript ~6.0.3, Angular Material and CDK 22.2.6 (equal), firebase 13.2.0, Vitest, ESLint and the directory layout of the Structural Seed exists (AR1, AR2), versions reverified against the registry and any difference noted in the story record
**And** `ng build` and `ng test` pass, and the repository is under git with a `.gitignore` that excludes node_modules, the production environment file and emulator data.

**Given** `src/environments/`
**When** the app runs in `local`
**Then** `firebase.ts` connects Auth and Firestore to the emulators, and a committed example for the production config exists
**And** the production build fails with a clear message when the production file is missing (AR3).

**Given** `firestore.rules` and `firebase.json` with Auth and Firestore emulators
**When** `npm run test:rules` runs against the emulator (JDK 21 or newer)
**Then** tests using `@firebase/rules-unit-testing` prove: an unauthenticated request is denied on every path; a user cannot read or write another user's categories, items or preferences; every other path is denied (FR2, SM-3)
**And** Category, Item and `preferences/app` field rules of AD-10 are covered with valid and invalid vectors (lengths, types, `priority` values, `value is number`, key subset, `updatedAt == request.time`, `createdAt` unchanged on update, Item `categoryId` must reference an existing Category of the same uid).

**Given** the project
**When** `npm run check` runs
**Then** it runs ESLint, unit tests and rules tests and fails on the AD-15 violations that already apply: import table, `firebase/*` outside `core/data`, Angular or DOM in `domain`, a `functions/` directory (AR5)
**And** `npm run deploy` exists (check, rules, Hosting) but is not executed in this story and no Firebase project is created.

**Given** the scaffold is complete
**When** it is inspected
**Then** no Cloud Functions code or dependency exists (NFR7), and no feature reads or writes Firestore data yet.

### Story 1.2: Sign in with a persistent session

As a User,
I want to sign in with the email and password Bob created and stay signed in,
So that I reach my own space without logging in on every visit.

**Acceptance Criteria:**

**Given** `AuthService` exposes a session signal `unknown | signedOut | signedIn(uid)` and `signIn`/`signOut`
**When** the app starts
**Then** one route guard waits out `unknown`, redirects to `/login` when signed out, and protects every route except `/login` (AD-11)
**And** a signed-in session survives an app restart until logout (FR1).

**Given** the login screen at `/login` ported from the `login.html` composition (UX-DR1)
**When** the User enters valid credentials from the emulator
**Then** they land on `/categories`
**And** the password field has Show/Hide, there is no registration link and no password reset.

**Given** wrong credentials, an invalid email or a network failure
**When** the User submits
**Then** an inline message mapped from `invalid-credentials | invalid-email | network | unknown` is shown, no access is granted and raw Firebase text is never displayed.

**Given** `SessionScope` and the `sessionEpoch`
**When** the session changes
**Then** the epoch increments and the (still empty) store registry and local view state of the previous uid are reset, in-flight results with a stale epoch are discarded (AD-11)
**And** `shared/strings.ts` exists as the typed `it`/`en` dictionary with the login texts and the Material `*Intl` providers, default English, `<html lang>` following the Language signal (AR14), with the template-scan test of AD-15(e) active.

**Given** unit tests with a fake auth backend
**When** `npm run check` runs
**Then** the guard, the state transitions and the error mapping are covered.

### Story 1.3: App shell, responsive navigation and sign out

As a User,
I want a navigation that fits my screen and a sign-out I can reach from anywhere,
So that I can move around and leave safely on a shared device.

**Acceptance Criteria:**

**Given** the route table of AR17 in `shell` and `LayoutService` exposing `windowClass`
**When** the window is under 768 px, 768 to 1199 px, or 1200 px and up
**Then** a bottom bar, a rail or a drawer shows the three destinations Categories, Report, Settings, with `aria-current` on the active one (UX-DR2)
**And** the routes `/report` and `/settings` exist as placeholder screens, and a malformed or unknown id redirects to `/categories`.

**Given** any screen except Login
**When** the User opens the avatar menu
**Then** it shows name and email, Settings and Sign out, closes on outside tap, Escape or resize, and returns focus to the avatar on Escape (UX-DR3, AD-17)
**And** on medium and expanded windows Sign out is also the last entry of the rail or drawer.

**Given** the User chooses Sign out
**When** the action completes
**Then** only `AuthService.signOut()` is called with no confirmation, the User lands on `/login` and a snackbar reads "You have been signed out" for 5 seconds (FR1, UX-DR9)
**And** the snackbar component uses one polite `aria-live` region and a new snackbar replaces the old.

## Epic 2: Categories

A signed-in User can create Categories, see them on the home screen, open one and manage its identity.

### Story 2.1: Create and list Categories

As a User,
I want to create a Category and see all my Categories on the home screen,
So that I can open the right list quickly.

**Acceptance Criteria:**

**Given** `CategoryStore` loads the User's Categories once into a signal with `status` `loading | ready | error` and `domain/category.ts` defines the shape (AD-2, AD-5)
**When** a new User opens `/categories`
**Then** the empty state "Nothing here yet" with a filled "New category" button is shown and no FAB (FR3, UX-DR4)
**And** loading shows skeleton rows of 72 px.

**Given** the New category dialog (UX-DR5)
**When** the User submits a name
**Then** an empty name is rejected, a duplicate (trimmed, case-insensitive) shows an inline error, and a valid name creates the Category with State Label "Done" and Reportable off, shown in the list (FR3)
**And** the write goes through `CategoryStore.add` returning `ok` or `error(code)`, with a 10 s timeout and rollback on failure (AD-5), and the signal updates only after the confirmed write.

**Given** Categories exist
**When** the home screen is shown
**Then** Category cards show name and progress derived from Items (0 until Items exist), search by name filters in memory, and tapping a card opens `/c/:categoryId` (FR3)
**And** `/c/:categoryId` renders a header with the Category name and a back arrow and the empty-category state until Story 3.1 fills it, with the unknown-id guard redirecting to `/categories`.

**Given** Firestore rules from 1.1
**When** the story is verified against the emulator
**Then** a Category created through the app passes the rules and one User never sees another's Categories (FR2).

### Story 2.2: Category settings: rename, State Label, Reportable

As a User,
I want to rename a Category, choose its Done wording and mark it Reportable,
So that the list speaks my language and can track a number.

**Acceptance Criteria:**

**Given** the Items screen shell of 2.1
**When** the User opens the menu and chooses Category settings
**Then** `/c/:categoryId/settings` opens, ported from `category-settings.html` without the danger zone yet (UX-DR11)
**And** the back arrow returns to the Category.

**Given** the settings screen
**When** the User changes the name or the Done label (1 to 16 characters, with suggestions such as Bought and Read and a live preview) or toggles Reportable
**Then** the full Category document is saved with `createdAt` preserved and `updatedAt` set, and the change shows immediately on the Category screen and the home list (FR4)
**And** a name that duplicates another Category is rejected inline, and a failed save shows an inline error and keeps the typed values.

**Given** turning Reportable off later
**When** Values exist (from Epic 5)
**Then** the Category document changes but no Item data is touched (AD-2).

## Epic 3: Items

A User can capture, consult, tick, edit and delete Items, and clean up Categories.

### Story 3.1: Add an Item and see the list

As a User,
I want to add an Item to a Category and see open Items first,
So that I can capture something in seconds and find it again.

**Acceptance Criteria:**

**Given** `ItemStore` (load once, signal keyed by id, `ok | error(code)`, 10 s timeout, session epoch) and `domain/item.ts` with `initialDraft` and `domain/validation.ts` (AD-2, AD-5, AD-14)
**When** the User taps the Add item FAB on `/c/:categoryId`
**Then** the shared `ItemFormComponent` opens at `/c/:categoryId/i/new` with Title required, Description optional (max 4000), Category read-only, and a live preview (FR5, UX-DR10)
**And** `DraftStore` keeps typed values after a failed save and drops the draft after a confirmed save, Cancel or logout.

**Given** a valid Title
**When** the User saves
**Then** the Item is written as a full document with Priority `medium`, no Deadline, no Value, and appears at the top of the open Items within one second (FR5, NFR3)
**And** an empty Title is rejected by the shared validator, and no custom fields exist.

**Given** the Items screen (UX-DR6)
**When** it renders
**Then** the head card with progress ring, Open section, Done section (empty for now) and the empty-category state "Add item" are shown, Category cards on the home screen now show real progress, and Category data and Item data load once with no listeners.

**Given** the rules from 1.1
**When** the story is verified
**Then** Items written by the app pass the rules, including the `categoryId` existence check.

### Story 3.2: Edit an Item

As a User,
I want to edit an Item's Title and Description,
So that I can correct or extend what I noted.

**Acceptance Criteria:**

**Given** an Item row
**When** the User taps its edit icon (only the icon, not the row)
**Then** `/c/:categoryId/i/:itemId` opens the same `ItemFormComponent` with the stored values (FR5, UX-DR7, UX-DR10)
**And** an unknown Item id redirects to the Category.

**Given** the edit form
**When** the User changes Title or Description and saves
**Then** `ItemStore.update` writes the full document preserving `createdAt`, the list reflects it and the User returns to the Items screen
**And** a failed save shows an inline error under the form and the typed text is kept.

### Story 3.3: Mark Done with Undo

As a User,
I want to tap an Item to mark it Done and undo a mistaken tap,
So that I can tick things off one-handed.

**Acceptance Criteria:**

**Given** an open Item
**When** the User taps its row
**Then** `toggleDone` updates the signal at once (under 100 ms), the row shows a filled check and strikethrough and moves to the Done section, and a snackbar names the Item with the Category's State Label and offers Undo (FR6, UX-DR9, UX-DR16)
**And** the row exposes `aria-pressed` and the progress ring updates.

**Given** the write fails or times out
**When** the result arrives
**Then** the state rolls back and a visible error is shown, and the next write to that document first re-reads it with `getDocFromServer` after a timeout (AD-5).

**Given** a Done Item or the Undo action
**When** the User taps the row or Undo
**Then** it returns to the open list, the state persists across sessions and devices, and Done Items stay visible until cleared or deleted.

### Story 3.4: Delete an Item

As a User,
I want to delete an Item I no longer need,
So that my list stays clean.

**Acceptance Criteria:**

**Given** the edit form of an existing Item
**When** the User chooses Delete item
**Then** a confirm dialog names the Item and says it cannot be undone, with a destructive text button in the error color, Escape or Cancel dismisses (FR7, UX-DR12)
**And** the button is absent in the new-Item form.

**Given** the User confirms
**When** `ItemStore.remove` succeeds
**Then** the Item is physically deleted, gone from the signal and the list, and the User returns to the Items screen
**And** a failure shows an inline error and keeps the Item.

### Story 3.5: Clear Done Items and delete a Category

As a User,
I want to clear the Done Items of a Category and delete a Category,
So that I can reset the shopping list and remove what I no longer use.

**Acceptance Criteria:**

**Given** Category settings gets its danger zone (UX-DR11)
**When** the User chooses Clear done items
**Then** a confirm dialog names the Category and the number of Done Items, and on confirmation `ItemStore.removeDone(categoryId)` deletes them in batches of at most 500 and the User stays on the screen (FR4, AD-6)
**And** a single Done Item can also be cleared from its row menu or edit form after confirmation (FR4).

**Given** Delete category
**When** the User confirms a dialog stating the Item count
**Then** `CategoryStore.remove(id)` deletes the Items first in batches, then the Category document, returns `ok` only after the Category is gone, updates both signals and routes to `/categories` (FR4, AD-6)
**And** a failure midway leaves a Category with fewer Items and a retry completes the job.

**Given** the Item list screen
**When** it is inspected
**Then** none of these actions appear on it (FR4).

### Story 3.6: Search and filter chips

As a User,
I want to search an Items list and filter it,
So that I find what I need in a long Category.

**Acceptance Criteria:**

**Given** the Items screen
**When** the User types in the search field
**Then** both Open and Done sections filter in memory as they type (UX-DR6).

**Given** the chips All, Overdue, High priority, Has deadline
**When** the User selects one
**Then** exactly one chip is active and the Done section is filtered too, and the choice is kept per device in `localStorage` keyed by uid and Category and never sent to Firestore (AR18)
**And** Overdue and High priority return empty results until Epic 4 supplies those fields, with a neutral empty message.

### Story 3.7: Sort Open Items (Should)

As a User,
I want to sort open Items by Priority or Deadline,
So that the urgent ones come first.

**Acceptance Criteria:**

**Given** the sort icon on the Items screen
**When** the User opens it
**Then** a bottom sheet on compact and a centered sheet otherwise offers Newest first (default), Priority, Deadline, and selecting one closes the sheet (FR10, UX-DR8)
**And** the sort applies to open Items only, Done Items stay at the bottom, and the choice is remembered per Category in `localStorage` (AR18).

**Given** Items without Priority or Deadline data yet
**When** sorting by them
**Then** missing values sort last and the order is stable, and the sheet traps focus and restores it on close.

### Story 3.8: Two-pane Items layout

As a User on a wide screen,
I want the Category list beside the Items,
So that I can switch Category without going back.

**Acceptance Criteria:**

**Given** a window of 1024 px or wider
**When** I open an Items screen
**Then** the Category list shows on the left with the current Category selected and Items on the right, the back arrow is hidden, and choosing another Category changes the route and the right pane (UX-DR6)
**And** below 1024 px the single-column layout and the back arrow return, and the layout reads only `LayoutService.windowClass` (AR17).

## Epic 4: Deadlines, priority and reminders

A User can set a Deadline and Priority and be told when it arrives, inside the app.

### Story 4.1: Deadline and Priority on an Item

As a User,
I want to set a Priority and a Deadline on an Item,
So that I can see what matters and when.

**Acceptance Criteria:**

**Given** `domain/time.ts` (`isOverdue`, `isDueToday`, `isDueWithin`, `weekStart`, `monthStart`, `formatDeadline`) and `ClockService` exposing `now` refreshed every 30 s and on visibility change (AD-4, AR11)
**When** unit tests run
**Then** they cover overdue (`done === false` and `deadline < now`), boundaries and local-time formatting with a fake clock, and ESLint now rejects date construction outside those two files (AD-15b).

**Given** the Item form
**When** the User picks a Priority tile (Low, Medium default, High) and a Deadline using the quick chips Today, Tomorrow, Next week, No deadline or a date and time
**Then** both are saved as a Firestore Timestamp and Priority value, can be changed or cleared (FR8), and the preview updates live (UX-DR10)
**And** a cleared Deadline is an absent field.

**Given** an Item row
**When** a Deadline or Priority is set
**Then** the row shows the outlined deadline chip in local time and a High chip using tertiary with the word "High", and the High priority and Has deadline filters of 3.6 now return results and sorting by Priority or Deadline of 3.7 now works (FR8, UX-DR7).

### Story 4.2: Overdue flag, Due soon and summary

As a User,
I want overdue Items flagged and surfaced on the home screen,
So that nothing past its Deadline goes unnoticed.

**Acceptance Criteria:**

**Given** an open Item whose Deadline has passed
**When** the app is opened or the clock ticks
**Then** the row shows the Overdue chip with the word "Overdue" in the error container, not by color alone, and the Overdue filter returns it (FR8, FR9, UX-DR7)
**And** Done or deleted Items are never flagged.

**Given** the Categories screen
**When** it renders
**Then** the summary card shows overdue (headline), open, due this week and number of Categories, all derived from the loaded Items with no stored counters (UX-DR4, AD-2)
**And** the Due soon strip lists open Items with a Deadline, overdue first then soonest, each card opening its Category, hidden when there are none, and Category cards show the open-count badge (none when zero).

### Story 4.3: In-app Deadline alert

As a User,
I want an alert in the app when a Deadline arrives,
So that I can act on it while I am using MemoIt.

**Acceptance Criteria:**

**Given** `ReminderService` deriving the open Items whose Deadline has arrived from `ItemStore` and `ClockService` (AD-7)
**When** a Deadline arrives while the app is open
**Then** a banner at the top of any screen states what is due within one minute, auto-dismisses after 8 s and opens that Item when tapped (FR9, NFR4, UX-DR13)
**And** exactly one alert is raised per `(itemId, deadlineMillis)`, remembered in `sessionStorage` so a reload does not repeat it.

**Given** an Item marked Done or deleted before its Deadline
**When** the Deadline arrives
**Then** no alert appears.

**Given** a session change
**When** a User signs out
**Then** the reminder memory resets (AD-11), and nothing is sent outside the app (no push, no email, no server code).

## Epic 5: Values and reports

A User can log numbers and see their trend.

### Story 5.1: Enter a Value

As a User,
I want to enter a number on Items of a Reportable Category,
So that I can track weight, spending or pages.

**Acceptance Criteria:**

**Given** `domain/number.ts` parsing a decimal comma or point in either Language, rejecting non-numeric input, with one formatter per Language and one rounding rule, and ESLint now rejecting `toFixed`, `toLocaleString` and `Intl.NumberFormat` elsewhere (AD-16, AD-15d)
**When** unit tests run
**Then** shared vectors are exercised against both the client validator and the Firestore rules (`value is number`).

**Given** a Category with Reportable on
**When** the User opens the Item form
**Then** the Value panel is shown and non-numeric input is rejected with decimals allowed (FR11)
**And** the panel is absent for non-Reportable Categories, an absent Value is an absent field never `null` or `0`, and turning Reportable off hides the field but keeps stored Values.

### Story 5.2: Read the Report

As a User,
I want a chart of my Values over time,
So that I can see the trend.

**Acceptance Criteria:**

**Given** `domain/series.ts` (AD-8)
**When** unit tests run
**Then** each Item with a Value is placed at its Deadline else `createdAt` in local time, buckets are weeks starting Monday or calendar months, a bucket value is the sum, a bucket with no Values is absent (a gap, never 0), the period filter is applied before bucketing, and the summary (latest, change, average, lowest) excludes gaps.

**Given** `/report` loaded lazily with Chart.js and ng2-charts
**When** the User opens it for a Reportable Category
**Then** a summary card, period chips (3 months, 6 months, 1 year, All), a weekly or monthly switch and one line chart with `spanGaps: true` are shown, colors read from theme tokens at render time, with a text or table alternative from the same series and a link to the Category list (FR12, UX-DR14, AD-17)
**And** the chosen period and aggregation are kept per device in `localStorage` (AR18).

**Given** no Reportable Category, or one without Values
**When** the screen renders
**Then** an empty state explaining how to enable Reportable or add a Value is shown, not an error, and no other chart type exists.

## Epic 6: Personalization

A User can set language and appearance once and have it everywhere.

### Story 6.1: Choose language

As a User,
I want to switch between Italian and English,
So that the app speaks my language.

**Acceptance Criteria:**

**Given** `PreferencesStore` persisting `users/{uid}/preferences/app` as a full document, mirroring Language to `localStorage` to avoid a flash on start, never letting a late load overwrite a later choice, and rolling back with a visible error if the save fails (AD-12, AD-9)
**When** the User picks Italian or English in Settings
**Then** every label, message, Material built-in text, number and date follows it at once, `<html lang>` updates and the choice persists per User across devices (FR13)
**And** the default is English and the preferences rules of 1.1 accept `language` in `it | en`.

**Given** the dictionary
**When** `npm run check` runs
**Then** a missing `it` or `en` key fails compilation, and the template-scan test finds no literal UI text anywhere (AD-9, AD-15e).

### Story 6.2: Choose theme and accent

As a User,
I want my own accent and light, dark or system appearance,
So that the app feels like mine.

**Acceptance Criteria:**

**Given** `shared/theme.ts` mapping one accent (nine presets or `custom` with `hue` 0 to 360 and `chroma` 0 to 0.3) and a scheme to every Material 3 role with the OKLCH tonal formulas, set as CSS custom properties on `<html>` (AD-12, UX-DR15, UX-DR18)
**When** the User picks a swatch, moves the hue slider or changes Appearance in Settings
**Then** every screen recolors instantly with a live mini-app preview and no Save button, and the choice persists per User through `PreferencesStore` (FR14)
**And** `system` follows `prefers-color-scheme`, defaults before load are indigo, `system`, English, and error, overdue and High colors never follow the accent.

**Given** the unit test
**When** `npm run check` runs
**Then** AA contrast (4.5:1 text, 3:1 graphics) is computed for the text and essential-graphic token pairs of every preset in both schemes and sampled custom hues, and the build fails below that (NFR5)
**And** no color literal appears in components.

## Epic 7: Hardening and optional install

The finished app is verified end to end and, if wanted, installable.

### Story 7.1: End-to-end journeys and accessibility checks

As Bob,
I want the main journeys and the accessibility floor verified automatically,
So that I can trust the app before I rely on it.

**Acceptance Criteria:**

**Given** Playwright against the emulators (never a real project)
**When** the suite runs
**Then** it covers UJ-1 (capture an Item), UJ-2 (tick Items, Undo, clear Done), UJ-3 (Deadline alert and overdue flag), UJ-4 (Values and Report) and UJ-5 (a second User sees none of the first User's data), including cross-user isolation through the UI (SM-3)
**And** axe runs on every screen in light and dark with no AA violations (UX-DR17).

**Given** the accessibility floor
**When** the suite runs
**Then** it asserts 48 px targets, 72 px rows, dialogs and the account menu trap and restore focus, Escape closes them, reduced motion is honored and the layout reflows at 200% text.

### Story 7.2: Installable app (Could)

As a User,
I want to add MemoIt to my home screen,
So that it opens like an app.

**Acceptance Criteria:**

**Given** the finished app
**When** the web manifest and icons are added
**Then** the browser offers installation and the app opens standalone on the Categories screen
**And** no service worker caching of data, no offline mode, no push and no Cloud Functions are added (PRD 6.3, AD-3).

**Given** this story is Could
**When** time is short
**Then** it may be skipped without affecting any FR.
