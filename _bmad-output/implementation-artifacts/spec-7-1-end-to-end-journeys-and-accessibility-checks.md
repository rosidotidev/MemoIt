---
title: 'Story 7.1: End-to-end journeys and accessibility checks'
type: feature
status: in-review
route: dispatch
---

## Intent
<frozen-after-approval>
A Playwright suite runs against the Auth and Firestore emulators only (project demo-memoit) and covers UJ-1 to UJ-5 (including cross-user isolation through the UI, SM-3). axe checks every screen and dialog in light and dark with no WCAG A/AA violation. The accessibility floor is asserted: 48 px targets, 72 px rows, dialogs and the account menu restore focus and close on Escape, dialogs trap Tab, reduced motion is honored, the layout reflows at 200% zoom on a 640 px window (320 px reflow width).
</frozen-after-approval>

## Code Map
- `playwright.config.ts`: testDir `e2e`, files `*.e2e.ts` (so `ng test` never picks them up), one worker, `npm start` as web server (dev environment already points at the emulators).
- `e2e/support.ts`: users created through the Auth emulator REST API (the app has no sign-up), Firestore wipe, UI helpers.
- `e2e/journeys.e2e.ts`: UJ-1..UJ-5. The Deadline alert uses `page.clock` to jump to the Deadline.
- `e2e/accessibility.e2e.ts`: axe (light/dark) and the floor checks.
- `package.json`: `test:e2e` = `firebase emulators:exec --only auth,firestore --project demo-memoit "playwright test"`; deliberately not part of `npm run check` (needs a browser).
- `src/styles.css`: global `prefers-reduced-motion` rule.

## Implementation Notes
- Decision: e2e kept out of `npm run check` to keep the check fast and browser-free; run `npm run test:e2e` on demand.
- The account menu is a popover, not a modal: the test asserts Escape closes it and restores focus to the avatar, not a Tab trap.
- Text zoom is approximated with CSS `zoom: 2` on a 640 px window.
- Settings sliders/swatches are covered by axe and the 48 px check; no a11y defect surfaced, so no component change was needed. The other deferred a11y nits (live regions, aria-valuetext) stay deferred as low impact.
