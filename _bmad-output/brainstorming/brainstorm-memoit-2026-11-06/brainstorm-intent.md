# MemoIt - Brainstorm Intent

Input for bmad-product-brief / bmad-prd. Source: brainstorming session 2026-11-06 (later decisions override earlier ones).

## Product Summary and Why
MemoIt is a simple, private web app for jotting down and consulting notes, to-do lists and wish lists, organized by category. It is a personal tool for Bob; family members get their own separate accounts (no shared data). Principle: a clean, consultation-first interface, with rare actions moved out of the list into category management.

## Core Job to Be Done
"When I suddenly remember something, I want to put it in the right section right away, and later consult what I noted (e.g. open 'Grocery list' and see what I wanted to buy)." Primary usage is consulting, not just writing.

Example categories: Books to buy, Grocery list, Personal accounts (username/password).

## Data Model
- Category: name, configurable state label (e.g. Bought / Done / Read).
- Item: title, description (free text, no per-category custom fields), "evaso" state, optional deadline (date and time), priority, optional numeric value (for categories declared "reportable"; feeds time-value charts).
- Category also: "reportable" flag.

## v1 Scope (final MoSCoW)
**Must**
- Multi-user: separate accounts, data isolated per user
- Login only (no sign-up screen)
- Create/choose category; selecting it shows its items (central feature)
- Add and edit item (title + description)
- Mark item "evaso": persistent, visible as check/strikethrough, moved to bottom, re-activatable by tapping again; tap on the row toggles it (with undo)
- Hard delete of an item (with confirmation)
- Category management hub: rename, state label, empty all evasi (bulk/single), delete category
- State label configurable per category
- Optional deadline (date and time) per item
- Priority per item
- Language selection; color/theme selection
- Deadline notifications/reminders
- "Reportable" items/categories with numeric value for time-value charts (spending, weight, reading)

**Should**
- Sorting the list by priority and deadline

**Could**
- Installable PWA

**Won't (for now)**
- Sharing categories/lists with family (real-time sync)
- Encryption of passwords
- Self-service registration

## Key Decisions and Constraints
- Angular web app, responsive, mobile-first (desktop/tablet supported); not native. PWA optional, to be decided in PRD/architecture.
- Firebase: Firestore + Firebase Auth.
- Accounts created manually by Bob in Firebase Authentication; no registration flow (smaller scope and attack surface).
- No sharing: each family member has their own account and separate data.
- Per-user data isolation via Firestore security rules on uid (essential, since passwords are stored in clear text).
- Passwords live in plain text in the item description in v1, protected only by login + Firestore rules; encryption deferred past v1.
- Delete is physical (hard delete), no soft delete/trash.
- Evaso items stay visible in the list until the user clears them.
- No One-Feature-Only cut: all listed Must features stay in v1.

## Open Questions for the PRD
- Exact visual form of the evaso state (check, strikethrough, both) and undo behavior.
- PWA: yes/no in v1, offline needs.
- Deadline reminders are Must: delivery channel (browser push, email, in-app), behavior when the app is closed, time zone handling.
- Charts are Must: chart types, aggregation periods, how numeric values are entered and validated.
- Priority scale (levels, default) and how it is shown.
- Default categories at account creation, or empty start?
- Category deletion with existing items: cascade rules and confirmation.
- When to schedule password encryption and what approach (acceptable risk window).
- Default language (Italian/English) and whether the UI is localized in v1.
