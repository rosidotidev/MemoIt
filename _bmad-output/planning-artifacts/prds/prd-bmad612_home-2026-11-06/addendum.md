# Addendum: MemoIt

Technical-how and detail that does not belong in the PRD narrative. Downstream input for architecture.

## Stack (from brief)
- Angular web app, mobile-first responsive; Firebase Authentication and Firestore.

## Data model sketch
- `users/{uid}/categories/{categoryId}`: name, stateLabel, reportable, createdAt.
- `users/{uid}/categories/{categoryId}/items/{itemId}`: title, description, done, deadline (timestamp), priority, value (number), createdAt.
- Rules: `allow read, write: if request.auth.uid == uid` on the `users/{uid}/**` subtree. Rules tests with the Firebase emulator.

## Reminders
- **v1 (in scope):** in-app only. An alert while the app is open at the Deadline, and an overdue flag on next open. Client-side timer or check on open; no backend scheduler.

## Deferred: delivery outside the app (PRD §6.3)
Not in v1. Kept here so the data model and architecture do not rule it out (for example, store Deadline as a timestamp, as already sketched).
- **Web push via FCM**: needs service worker; on iOS only for installed PWAs. A scheduler (Cloud Functions scheduled or Cloud Tasks per Item) sends at Deadline. Cloud Functions requires the Blaze plan.
- **Email** fallback via Firebase extension: simpler on iOS, less immediate. Also deferred, as it is out-of-app delivery.

## Deferred: offline (PRD §6.3)
Firestore offline persistence would give read access and queued writes without a connection. Not in v1; v1 requires connectivity.

## Password risk note
Descriptions may contain credentials in clear text in v1. Mitigation: strict rules, login required. Future: client-side encryption of a "secret" field with a user passphrase.

## Charts
Any Angular-compatible chart library (e.g. ngx-charts or Chart.js); pick in architecture.
