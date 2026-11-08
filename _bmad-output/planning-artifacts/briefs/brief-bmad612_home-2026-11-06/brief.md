---
title: "Product Brief: MemoIt"
status: draft
created: 2026-11-06
updated: 2026-11-06
---

# Product Brief: MemoIt

## Executive Summary

MemoIt is a simple, private web app for keeping notes, to-do lists and wish lists, organized by category and built to be *consulted* more than written. Open the app, pick a category such as "Grocery list" or "Books to buy", and see exactly what you noted down. Tap an item to mark it done, and the mark stays.

It is a personal tool for Bob, with separate accounts for family members who each keep their own private data. It is built as an Angular web app on Firebase (Firestore and Authentication), mobile-first and responsive on tablet and desktop.

This is a passion project, so the brief is right-sized: it fixes what v1 must do and what it will not, and leaves the deeper detail to the PRD.

## The Problem

Ideas for things to buy, do or remember arrive at random moments: a book to buy, a food item for the shopping list, the username and password of an account just created. Today these end up scattered across generic note apps, chats and memory, mixed together and hard to review in context. Checking "what did I want to buy?" means digging, and nothing tells you which items are already handled.

> [ASSUMPTION] Bob currently uses a mix of generic tools; the brainstorming did not name specific apps or their failures.

## The Solution

A category-first list app:

- Choose a category and see its items. This is the central screen.
- Every item has a title and a free-text description. Nothing more is required to capture a thing.
- A tap marks an item as done (a persistent, visible state), and a second tap reopens it. The wording of "done" fits the category: Bought, Done, Read.
- Optional deadline with date and time, a priority, and reminders when a deadline arrives.
- Category management is where rare actions live: rename, state label, clear all done items, delete the category. The list stays clean.
- Categories can be marked as "reportable": items carry a numeric value, and the app draws time-value charts (spending, weight, reading).
- Language and color theme are selectable.

## What Makes This Different

Honestly, it is not a technical moat. MemoIt is different because it is deliberately small and built around one person's real habits: consultation first, one tap to mark done, no custom fields per category, and no sign-up flow. It is also fully owned and private, running on Bob's own Firebase project, which matters because it holds credentials.

## Who This Serves

- **Primary: Bob.** Captures things on the phone, often one-handed, and consults them later, for example at the supermarket.
- **Secondary: family members.** Each has an account created by Bob and their own separate data. They share nothing.

Success for them: finding what they noted down in a few seconds, and trusting that it is theirs alone.

## Success Criteria

- Adding an item and finding it again takes seconds on a phone.
- Marking an item done is a single tap, and the state persists across sessions and devices.
- Each user sees only their own data, verified through Firestore security rules.
- Family members use it regularly without needing help.
- Deadline reminders reach the user in time to be useful.

> [ASSUMPTION] The criteria are qualitative because this is a personal project. No numeric targets were set.

## Scope

**In for v1 (Must)**
- Login with accounts created manually in Firebase; data isolated per user; no registration screen.
- Categories: create, choose, manage (rename, state label, clear done items, delete).
- Items: add, edit, title plus description, tap to mark done, hard delete with confirmation.
- Deadline with date and time, priority, and reminders.
- Reportable categories with numeric values and time-value charts.
- Language and theme selection.
- Mobile-first responsive layout.

**Should:** sorting the list by priority and deadline.

**Could:** open-item count next to each category; installable PWA.

**Out for now:** sharing lists between people, encryption of stored passwords, self-service registration, voice, photo and geolocation input.

## Risks and Open Questions

- **Passwords in clear text.** Credentials typed into an item description are stored unencrypted in v1, protected only by login and per-user Firestore rules. Encryption is deferred, and the rules must be correct from day one.
- **Reminders and charts are Must but heavy.** Reminders need a delivery channel that works when the app is closed (push, email, in-app). Charts need decisions on types and aggregation. Both can stretch the v1 timeline.
- Open for the PRD: exact look of the done state and undo, PWA yes or no, priority scale, default categories at account creation, behavior when deleting a category that still has items, default language.

## Vision

If it works, MemoIt becomes the family's quiet home for everyday lists: encrypted credentials, shared lists where wanted, richer reports. It stays small and fast, and does not turn into a general productivity suite.
