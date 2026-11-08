---
title: '1-3 App shell, responsive navigation and sign out'
type: 'feature'
created: '2026-11-06'
status: 'done'
baseline_commit: '87b5febd4ba362ed49e107d9ce797be2488b068f'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-2-sign-in-with-a-persistent-session.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** A signed-in User lands on a bare placeholder: no navigation, no way to reach Report or Settings, no sign-out (FR1, UX-DR2, UX-DR3, UX-DR9).

**Approach:** Add a `shell` with a responsive navigation chosen by a `windowClass` signal from `LayoutService`, an avatar account menu, Sign out, one polite snackbar, and placeholder `/report` and `/settings`. Hand-built with CSS tokens, no Material.

## Boundaries & Constraints

**Always:** Layers per AD-1: `LayoutService` and snackbar service/component in `shared`; shell, nav and account menu in `shell`; Report/Settings placeholders in `features/report`, `features/settings`. Standalone, OnPush, signals, prefix `memo-`, specs next to files. All text from `strings.ts` (en and it, type-enforced); no literal text in templates. Colors from tokens in `styles.css`. Targets at least 48 px. No component measures the window; only `LayoutService` does. Window classes: compact < 768, medium 768-1199, expanded >= 1200. Sign out calls only `AuthService.signOut()`, no confirmation, then navigates to `/login` and shows the snackbar "You have been signed out" (5 s). Name and email come from the Firebase user via the auth backend (display name falls back to the email).

**Never:** Material components, Notifications, "Remind me", language/theme switchers (Epic 6), real data, Firestore, deploy. Do not copy mockup HTML/CSS/JS. Do not add the `/c/...` routes (Epics 2-3).

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Window class | width 767 / 768 / 1199 / 1200 | compact / medium / medium / expanded, updated on resize | N/A |
| Navigation | compact / medium / expanded | bottom bar / rail / drawer with Categories, Report, Settings; `aria-current="page"` on the active destination only | N/A |
| Sign out entry | medium / expanded | Sign out is the last rail/drawer entry; not in the bottom bar | N/A |
| Unknown path | `/nope`, `/` | redirect to `/categories` | N/A |
| Login screen | `/login` | no shell, no avatar | N/A |
| Open menu | tap avatar | shows name, email, Settings, Sign out; avatar `aria-expanded=true` | N/A |
| Close menu | outside tap, Escape, window class change | menu closes; Escape returns focus to the avatar | N/A |
| Sign out | choose Sign out | `signOut()` called once, lands on `/login`, snackbar reads the sign-out text | `signOut` rejects: stay put, snackbar shows the generic error text |
| Snackbar | show A then B | B replaces A, one polite `aria-live` region, hides after 5 s | N/A |

</frozen-after-approval>

## Code Map

- `src/app/core/data/auth-backend.ts` -- `onChange` callback gains an optional profile `{ email, name }`; Firebase backend fills it from `user.email`/`user.displayName`; `core/state/session.state.ts` gets a `profile` signal set by `AuthService` (`auth.service.ts`); update `auth.service.spec.ts` and fakes (`app.routes.spec.ts`)
- `src/app/shared/layout.service.ts` -- `WindowClass`, `windowClass` signal from `window.innerWidth` + resize listener; `shared/snackbar.service.ts` + `snackbar.component.ts` -- `show(text)`, 5 s timer, replaces previous, polite live region
- `src/app/shared/strings.ts` -- add `nav` (categories, report, settings, signOut, navLabel), `account` (menuLabel, avatarLabel), `snackbar` (signedOut), `report`/`settings` titles
- `src/app/shell/shell.component.*` -- header with avatar, nav by `windowClass`, `<router-outlet>`; `nav` markup inside it; `shell/account-menu.component.*` -- avatar button + menu (Escape, outside click, class change, focus return)
- `src/app/features/report/report.component.ts`, `features/settings/settings.component.ts` -- placeholders with a heading
- `src/app/app.routes.ts` -- `login` (loginGuard), shell route (sessionGuard) with children `categories`, `report`, `settings`, `''`/`**` redirect to `categories`; `src/app/app.ts` -- add `<memo-snackbar />` so it shows over Login; `src/styles.css` -- tokens for nav
- Reuse: `AuthService`, `SessionState`, `sessionGuard`, `LanguageService.strings`; do not change `SessionScope`, `login.component.*`; `template-text.spec.ts` must keep passing

## Tasks & Acceptance

**Execution:**
- [x] `core/data/auth-backend.ts`, `auth.service.ts`, `core/state/session.state.ts` + specs -- expose profile (email, name)
- [x] `shared/layout.service.ts`, `snackbar.service.ts`, `snackbar.component.ts` + specs -- breakpoints, replace, 5 s timer (fake timers), live region
- [x] `shared/strings.ts` -- new keys in en and it
- [x] `shell/*`, `features/report`, `features/settings`, `app.routes.ts`, `app.ts`, `styles.css` + specs -- shell, nav, menu, sign out, routing
- [x] Verify: `npx ng build`, `npm run check`

**Acceptance Criteria:**
- Given a signed-in User, when the window class changes, then the matching navigation shows with `aria-current` on the active destination.
- Given the account menu is open, when Escape is pressed, then it closes and the avatar has focus.
- Given a signed-in User, when Sign out is chosen, then the session ends, `/login` is shown and the snackbar text is visible.

## Implementation Notes

No Material; menu is a hand-built disclosure. Not checked in a browser. Sign-out assumes Firebase reports signedOut before signOut() resolves (tested with fake backend only).

## Spec Change Log

## Review Triage Log

- patch (medium): signOut re-entrancy; no redirect when session ends while shell mounted; null profile hid avatar/compact Sign out; snackbar offset wrong on /login -- fixed.
- patch (low): surrogate-pair initial, aria-haspopup/aria-controls mismatch, missing FirebaseAuthBackend mapping test and /report,/settings guard tests -- fixed.
- defer (low): menu arrow-key nav and focus-out close, no icons in nav, snackbar dismiss/pause, returnUrl, skip link, focus-visible styles, dark tokens, nav array refactor, dedicated signOutFailed string, breakpoint literal in CSS.

## Design Notes

Decisions taken without the user (keep the product small): no Material (so the `*Intl` deferral from 1.2 stays open); profile added as an optional second argument so the 1.2 contract holds; the snackbar lives in `App` so it survives the navigation to `/login`; no returnUrl.

## Verification

**Commands:**
- `npx ng build` -- expected: success
- `npm run check` -- expected: pass
