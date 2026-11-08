---
title: MemoIt
status: final
created: 2026-11-06
updated: 2026-11-06
---

# PRD: MemoIt
*Working title — confirm.*

## 0. Document Purpose

This PRD defines v1 of MemoIt for Bob (builder and primary user) and for downstream workflows: UX, architecture, and epics/stories. It builds on `briefs/brief-bmad612_home-2026-11-06/brief.md` and the brainstorming intent in `brainstorming/brainstorm-memoit-2026-11-06/brainstorm-intent.md`; it does not duplicate them. Vocabulary is anchored in the Glossary (§3). Features are grouped (§4) with globally numbered FRs nested under them. Inferred points are tagged `[ASSUMPTION]` inline and indexed in §9. Technical choices beyond the stated stack live in `addendum.md`.

## 1. Vision

MemoIt is a simple, private web app for keeping notes, to-do lists and wish lists, organized by Category. It is built to be *consulted* more than written: open "Grocery list" at the supermarket and see exactly what you wanted to buy; tap an Item and it is marked Done, and stays that way.

It is a personal tool for Bob. Family members get their own accounts, created by Bob, each with strictly separate data. It runs as an Angular web app on Bob's own Firebase project (Firestore and Authentication), mobile-first, responsive on tablet and desktop.

It deliberately stays small: one tap to capture into the right Category, one tap to mark Done, no custom fields per Category, no sign-up flow. It is not a general productivity suite.

## 2. Target User

### 2.1 Jobs To Be Done

- When I suddenly remember something (a book to buy, a food item, the credentials of an account I just created), I want to put it in the right Category right away.
- When I'm at the shop or planning my day, I want to open a Category and see what I noted and what is already handled.
- When something has a due date, I want to be reminded in time.
- When I track a number over time (spending, weight, pages read), I want to see it as a chart.
- As Bob, the builder: I want a tool I fully own, whose data nobody else can read.

### 2.2 Non-Users (v1)

- People outside the family, and anyone expecting self-service sign-up.
- Groups wanting shared or collaborative lists.

### 2.3 Key User Journeys

`[ASSUMPTION]` Journeys are drafted from the brainstorming scenes, not narrated by the user.

- **UJ-1. Bob captures a book on the go.**
  - **Persona + context:** Bob, one-handed on the phone, hears about a book he wants to read.
  - **Entry state:** Logged in (session persists); on the Category list screen.
  - **Path:** taps "Books to buy" → taps Add → types title "Dune", a short note → saves.
  - **Climax:** the Item appears at the top of the open Items in the Category.
  - **Resolution:** Bob closes the app; the Item is there on every device.

- **UJ-2. Bob consults the grocery list at the supermarket.**
  - **Persona + context:** Bob in the aisle, phone in one hand, cart in the other.
  - **Entry state:** Logged in; on the Category list.
  - **Path:** opens "Grocery list" → scans the open Items → taps each as he drops it in the cart.
  - **Climax:** each tapped Item shows the Done mark and drops to the bottom; the open ones stay on top.
  - **Resolution:** at home he opens Category management and clears all Done Items. **Edge case:** a mistaken tap is reverted via undo or by tapping again.

- **UJ-3. Bob is reminded of a deadline.**
  - **Persona + context:** Bob noted "Renew car insurance" with a Deadline tomorrow 09:00 and High priority.
  - **Entry state:** Logged in; the app is open, or Bob opens it after the Deadline.
  - **Path:** the in-app Reminder appears (or, on opening, the home screen shows the overdue Item) → Bob taps it → the app opens on that Item.
  - **Climax:** he sees the Item flagged overdue, with its Deadline and Priority.
  - **Resolution:** he marks it Done. **Edge case:** if the app is closed at the Deadline, nothing is sent; the Item is flagged overdue the next time Bob opens the app (push is deferred, §6.3).

- **UJ-4. Bob tracks his weight over months.**
  - **Persona + context:** Bob has a Reportable Category "Weight".
  - **Entry state:** Logged in; Category "Weight" is Reportable.
  - **Path:** adds an Item each week with a Value (e.g. 82.4) → opens the Report view.
  - **Climax:** a time-Value chart of his entries.
  - **Resolution:** he sees the trend and keeps logging.

- **UJ-5. Bob's family member uses her own space.**
  - **Persona + context:** Giulia, family member, has an account created by Bob.
  - **Entry state:** Receives credentials from Bob; first login.
  - **Path:** logs in → starts with an empty list of Categories → creates her own.
  - **Climax:** she sees only her own data; none of Bob's.
  - **Resolution:** she uses it without help.

## 3. Glossary

- **User** — A person with an account created manually by Bob in Firebase Authentication. Owns Categories; sees only their own.
- **Category** — A named collection of Items belonging to one User. Has a State Label and a Reportable flag.
- **Item** — A single entry in a Category: Title, Description, Done state, optional Deadline, Priority, optional Value.
- **Title / Description** — Short required name of an Item / optional free text (may hold credentials in clear text in v1).
- **Done** — Persistent, visible state of an Item meaning handled. Reversible by tapping again.
- **State Label** — Per-Category wording for Done (e.g. Bought, Done, Read).
- **Deadline** — Optional date and time attached to an Item.
- **Priority** — Item importance level. `[ASSUMPTION]` Three levels: Low, Medium (default), High.
- **Reminder** — An in-app alert shown to the User when an Item's Deadline arrives or has passed. Delivery outside the app (push) is deferred (§6.3).
- **Reportable Category** — A Category whose Items carry a numeric Value, enabling a Report.
- **Value** — Numeric amount on an Item in a Reportable Category.
- **Report** — Time-Value chart built from the Items of a Reportable Category.
- **Category management** — The per-Category screen holding rare actions (rename, State Label, clear Done Items, delete, Reportable flag).

## 4. Features

### 4.1 Authentication and Data Isolation

**Description:** Users log in with credentials created by Bob in Firebase Authentication. There is no registration screen. Every piece of data is bound to the owning User's uid and protected by Firestore security rules, which is essential because Descriptions can hold credentials in clear text. Realizes UJ-5.

**Functional Requirements:**

#### FR-1: Login and logout

A User can log in with email and password and log out. Realizes UJ-5.

**Consequences (testable):**
- Unauthenticated visitors see only the login screen; all other routes redirect to it.
- The session persists across app restarts until logout.
- Wrong credentials show an error and grant no access.

**Out of Scope:** registration, password reset UI `[ASSUMPTION]` (Bob resets passwords in the Firebase console).

#### FR-2: Per-User data isolation

A User can read and write only their own Categories and Items. Realizes UJ-5.

**Consequences (testable):**
- Firestore rules deny any read or write where the document owner uid differs from the authenticated uid.
- Rules deny all access to unauthenticated requests.
- A rules test suite proves cross-user access is rejected.

**Feature-specific NFRs:**
- Security rules are implemented and tested before any feature stores real data.

### 4.2 Categories

**Description:** Categories are the primary navigation. The home screen lists the User's Categories; selecting one opens its Items. A new User starts with no Categories `[ASSUMPTION]`. Rare actions live in Category management, keeping the list screen clean. Realizes UJ-1, UJ-2, UJ-4, UJ-5.

**Functional Requirements:**

#### FR-3: Create and choose a Category

A User can create a Category with a name and open it to see its Items. Realizes UJ-1, UJ-5.

**Consequences (testable):**
- Creating requires a non-empty name; names are unique per User `[ASSUMPTION]`.
- State Label defaults to "Done" and Reportable defaults to off.
- Tapping a Category opens its Item list.

#### FR-4: Category management

A User can open Category management to rename the Category, set its State Label, toggle Reportable, clear Done Items, and delete the Category. Realizes UJ-2.

**Consequences (testable):**
- Rename and State Label changes are reflected immediately on the Item list.
- "Clear Done Items" removes all Done Items of that Category after confirmation, and can be applied to a single Done Item as well.
- Deleting a Category that still has Items asks for explicit confirmation stating the Item count and then hard-deletes the Category and all its Items `[ASSUMPTION]`.
- None of these actions appear on the Item list screen itself.

### 4.3 Items

**Description:** An Item needs only a Title; Description is free text. The Item list shows open Items first and Done Items at the bottom, visually marked. Tapping an Item row toggles Done. Realizes UJ-1, UJ-2.

**Functional Requirements:**

#### FR-5: Add and edit an Item

A User can add an Item to a Category with a Title and Description, and edit both later. Realizes UJ-1.

**Consequences (testable):**
- Title is required; Description is optional.
- A new Item appears in the list within one second of saving.
- No custom per-Category fields exist.

#### FR-6: Toggle Done

A User can mark an Item Done and mark it open again by tapping it. Realizes UJ-2.

**Consequences (testable):**
- A tap on the row toggles Done in one action, with a short-lived undo prompt.
- Done Items show a check mark and strikethrough `[ASSUMPTION]` and move to the bottom of the list.
- The Done state persists across sessions and devices.
- Done Items stay visible until cleared (FR-4) or deleted.
- The Done mark uses the Category's State Label wording where text is shown.

#### FR-7: Delete an Item

A User can permanently delete an Item after confirmation. Realizes UJ-2.

**Consequences (testable):**
- A confirmation dialog precedes deletion; deletion is physical, with no trash or soft delete.

### 4.4 Deadlines, Priority and Reminders

**Description:** Items can carry an optional Deadline (date and time) and a Priority. In-app Reminders alert the User when a Deadline arrives or has passed. Delivery outside the app (push notifications) is deferred (§6.3); the options considered are kept in `addendum.md`. Realizes UJ-3.

**Functional Requirements:**

#### FR-8: Set Deadline and Priority

A User can set, change or clear a Deadline (date and time) and a Priority on an Item. Realizes UJ-3.

**Consequences (testable):**
- Priority defaults to Medium; Deadline defaults to none.
- Deadline and Priority are visible on the Item row when set.
- Overdue open Items are visibly flagged `[ASSUMPTION]`.
- Deadlines are stored with time zone awareness and shown in the device's local time `[ASSUMPTION]`.

#### FR-9: Deadline Reminders (in-app)

A User is alerted inside the app when an open Item's Deadline arrives or has passed. Realizes UJ-3.

**Consequences (testable):**
- While the app is open, an in-app alert appears within one minute of the Deadline `[ASSUMPTION: no lead-time offset in v1]`.
- When the app is opened after a Deadline has passed, the Item is flagged overdue on its row, and overdue Items are surfaced on the Category list.
- No alert appears for Items marked Done or deleted before the Deadline.
- Tapping the alert opens that Item.
- Nothing is sent outside the app in v1 (no push, no email); see §6.3.

**Notes:** `[NOTE FOR PM]` This replaces the earlier web-push channel at Bob's request. Closed-app delivery is deferred, so a Deadline that passes while the app is closed is only noticed on the next open.

#### FR-10: Sort the list *(Should)*

A User can sort a Category's open Items by Priority or Deadline.

**Consequences (testable):**
- Sorting keeps Done Items at the bottom.
- The chosen sort is remembered per Category `[ASSUMPTION]`.

### 4.5 Reportable Categories and Reports

**Description:** A Category flagged Reportable adds a numeric Value field to its Items, and a Report view draws a time-Value chart (spending, weight, reading). Realizes UJ-4.

**Functional Requirements:**

#### FR-11: Enter a Value

A User can enter a numeric Value on Items of a Reportable Category. Realizes UJ-4.

**Consequences (testable):**
- The Value field appears only for Reportable Categories.
- Non-numeric input is rejected; decimals are allowed.
- Turning Reportable off hides the Value field but does not delete stored Values `[ASSUMPTION]`.

#### FR-12: View a Report

A User can open a Report for a Reportable Category showing Value over time. Realizes UJ-4.

**Consequences (testable):**
- The chart plots Values by Item date: the Deadline if set, else creation date `[ASSUMPTION]`.
- A line chart is provided, with a choice of weekly or monthly aggregation (sum) `[ASSUMPTION]`.
- The User can limit the period shown to the last 3 months, 6 months, 1 year, or all `[ASSUMPTION]`.
- A summary above the chart shows the latest Value, the change over the period and the average `[ASSUMPTION]`.
- No other chart type is provided in v1.
- A Category with no Values shows an empty state, not an error.

### 4.6 Personalization

**Description:** Language and color theme are selectable per User. Realizes UJ-5.

**Functional Requirements:**

#### FR-13: Choose language

A User can switch the UI language between Italian and English; default English.

**Consequences (testable):**
- All UI text, including dates, follows the chosen language; the choice persists per User.

#### FR-14: Choose theme

A User can select a color theme (at least light and dark) `[ASSUMPTION]`; the choice persists per User.

### 4.7 Installable app *(Could)*

**Description:** The web app can be installed to the home screen as a PWA. Treated as Could. It is no longer needed for Reminders, since push is deferred (§6.3).

## 5. Non-Goals (Explicit)

- Not a general productivity suite: no projects, tags, subtasks, or collaboration.
- No custom fields per Category.
- No sharing of Categories or lists between Users.
- No native mobile apps.
- No soft delete or trash: delete is physical `[NON-GOAL for MVP]`.
- No self-service registration `[NON-GOAL for MVP]`.

## 6. MVP Scope

### 6.1 In Scope

- Login with manually created accounts; per-User isolation (FR-1, FR-2).
- Categories with management hub (FR-3, FR-4).
- Items: add, edit, Done toggle with undo, delete (FR-5 to FR-7).
- Deadline, Priority, in-app Reminders (FR-8, FR-9).
- Reportable Categories, Values and Reports (FR-11, FR-12).
- Language and theme (FR-13, FR-14).
- Mobile-first responsive layout.

### 6.2 Out of Scope for MVP

- Sorting by Priority/Deadline (FR-10): Should; ship if time allows.
- Open-item count beside each Category: Could.
- Installable PWA (4.7): Could.
- Sharing lists between Users; encryption of stored passwords `[NOTE FOR PM]` (emotionally load-bearing, revisit soon after v1); self-service registration; voice, photo and geolocation input.

### 6.3 Deferred (nice-to-have)

Wanted eventually, explicitly not in v1. Neither blocks the MVP, and the MVP must not be built in a way that rules them out.

- **Push notifications.** Reminders delivered outside the app (web push, closed-app delivery). Needs a service worker, PWA install on iOS, and a scheduler (Cloud Functions, which needs the Firebase Blaze plan); details in `addendum.md`. Revisit when the in-app Reminders prove insufficient in daily use. Would extend FR-9.
- **Offline.** Reading and capturing Items without a connection (Firestore persistence). Revisit if the app is regularly used where coverage is poor, such as in a supermarket. v1 requires a connection.

## 7. Success Metrics

Success: Bob and family use it weekly and don't drift back to scattered notes. No numeric analytics are collected.

**Primary**
- **SM-1**: Capturing an Item and finding it again takes seconds on a phone (informal timing, under ~10 s). Validates FR-3, FR-5.
- **SM-2**: Marking Done is a single tap and persists across devices. Validates FR-6.
- **SM-3**: Zero cross-User data access, proven by rules tests. Validates FR-2.

**Secondary**
- **SM-4**: Family members use it without needing help. Validates FR-1, FR-3.
- **SM-5**: An open Item past its Deadline is flagged within one minute while the app is open, and on the next open otherwise. Validates FR-9.

**Counter-metrics (do not optimize)**
- **SM-C1**: Number of features or settings per screen: more must not come at the cost of list cleanliness. Counterbalances SM-1.

## 8. Open Questions

None blocking v1. Decided on 2026-11-06:

- Closed-app Reminder delivery (push) and offline support: deferred (§6.3).
- Password encryption: not in v1. Descriptions stay in clear text, protected only by login and the Firestore rules (FR-2); revisit soon after v1 (§6.2).
- Charts: one line chart with weekly or monthly sum, a period filter and a summary (FR-12); no other chart types in v1.
- Reminder lead time: none in v1; the Reminder fires at the Deadline (FR-9).

## 9. Assumptions Index

- §2.3 — User journeys drafted from brainstorming, not narrated.
- §3 / FR-8 — Priority has three levels, default Medium.
- FR-1 — No password-reset UI; Bob resets in Firebase console.
- FR-3 — New Users start with no Categories; names unique per User.
- FR-4 — Deleting a non-empty Category cascades after explicit confirmation.
- FR-6 — Done shown as check mark plus strikethrough.
- FR-8 — Overdue flagging; time zone handling via local device time.
- FR-9 — In-app Reminder at Deadline time, no lead offset; no delivery outside the app in v1 (push deferred, §6.3).
- FR-10 — Sort choice remembered per Category.
- FR-11 / FR-12 — Value retained when Reportable is turned off; Report plots by Deadline else creation date; line chart with weekly/monthly sum.
- FR-13 — (resolved) default language is English.
- FR-14 — At least light and dark themes.
- §4.7 — PWA stays Could; no longer needed for Reminders.
- FR-12 — Period filter (3 months, 6 months, 1 year, all) and summary (latest, change, average) added to the Report.
