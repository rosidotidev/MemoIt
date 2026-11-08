---
title: '1-2 Sign in with a persistent session'
type: 'feature'
created: '2026-11-06'
status: 'done'
baseline_commit: '81dee06f0b89273bdbb44f9e7d07de1d1f7a899c'
route: 'dispatch'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/implementation-artifacts/spec-1-1-angular-22-scaffold-and-firestore-rules-with-emulator-tests.md'
  - '{project-root}/_bmad-output/planning-artifacts/ux-designs/ux-bmad612_home-2026-11-06/mockups/login.html'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The app has no session: any route is open, there is no login, and nothing proves a signed-in user survives a restart (FR1, AD-11).

**Approach:** Add `AuthService` (tri-state session, `signIn`/`signOut`) over a swappable auth backend, one route guard, `SessionScope` with `sessionEpoch`, the `/login` screen ported from `login.html`, and `shared/strings.ts` with the template-text scan test. Emulator only; Firebase Auth's default local persistence provides the restart-survival.

## Boundaries & Constraints

**Always:** Layers per AD-1: pure types and the error mapper in `domain`; session signal holder, `SessionScope` and guard in `core/state`; `AuthService` and the Firebase backend in `core/data` (only place importing `firebase/*`); `strings.ts` in `shared`; login in `features/auth`. Standalone, OnPush, signals, selector prefix `memo-`, specs next to files. No literal UI text in templates (all from `strings.ts`, default English). Colors from CSS custom properties defined in `styles.css` (tokens from DESIGN.md light values), no hex literals in components. Errors are `invalid-credentials | invalid-email | network | unknown`; raw Firebase text is never displayed.

**Never:** Registration link, password reset, "Keep me signed in", language switcher on Login (belongs to Epic 6), Material components, Firestore access, real Firebase project, deploy. Do not copy mockup HTML/CSS/JS. Do not build the shell, account menu or sign-out UI (Story 1.3); `signOut` exists on the service only.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| App start, restoring | auth backend has not reported yet | session `unknown`; guard waits, no redirect yet | N/A |
| Start, no user | backend reports null | session `signedOut`; protected route redirects to `/login` | N/A |
| Start, saved user | backend reports uid | session `signedIn(uid)`; protected route opens | N/A |
| `/login` visited while signed in | session `signedIn` | redirect to `/categories` | N/A |
| Valid sign-in | correct email and password | session `signedIn(uid)`, navigate to `/categories` | N/A |
| Wrong credentials | backend code `auth/invalid-credential`, `auth/wrong-password`, `auth/user-not-found` | inline message, no access | maps to `invalid-credentials` |
| Bad email | `auth/invalid-email` | inline message | `invalid-email` |
| Network failure | `auth/network-request-failed` | inline message | `network` |
| Other failure | any other code | inline message | `unknown` |
| Session change | signedOut to signedIn(A), A to signedOut, A to B | `sessionEpoch` +1 each time; registered resets run | stale-epoch results discarded via `isCurrent(epoch)` |
| Submit while busy | double click | one request only; button disabled | N/A |

</frozen-after-approval>

## Code Map

- `src/app/app.config.ts` -- add providers: auth backend from `initFirebase(environment)`, language/strings, `SessionScope` start (app initializer); `src/app/app.routes.ts` -- `/login`, guarded `/categories` (placeholder component), `''` and `**` redirect to `/categories`
- `src/app/core/data/firebase.ts` -- reuse `initFirebase`; do not change
- `src/app/domain/session.ts` -- `Session` union, `AuthErrorCode`, `AuthResult`; `src/app/domain/auth-error.ts` -- `mapAuthError(code: string): AuthErrorCode` (pure)
- `src/app/core/state/session.state.ts` -- `SessionState` with writable `session` signal (starts `unknown`); `session-scope.ts` -- `sessionEpoch` signal, `registerReset(fn)`, `isCurrent(epoch)`, effect on session change; `session.guard.ts` -- `CanActivateFn` waiting out `unknown`
- `src/app/core/data/auth-backend.ts` -- abstract `AuthBackend` (`onChange(cb)`, `signIn(email, pw)`, `signOut()`) + `FirebaseAuthBackend` (firebase/auth, default persistence); `auth.service.ts` -- `AuthService` feeding `SessionState`
- `src/app/shared/strings.ts` -- typed `Strings` interface, `STRINGS: Record<Language, Strings>` (`en`, `it`), `Language` = `'en' | 'it'`; `language.service.ts` -- `language` signal (default `en`), `strings` computed, effect setting `document.documentElement.lang`
- `src/app/features/auth/login.component.ts` (+ `.html`, `.css`) -- form with email, password with Show/Hide, Sign in button, inline error (`role="alert"`), explanatory line that accounts are created by the owner; layout per `login.html` (split on expanded, tonal header on compact via CSS media queries)
- `src/app/features/categories/categories.component.ts` -- minimal placeholder heading (replaced in Epic 2)
- `src/styles.css` -- design tokens (light) and base styles
- `src/app/template-text.spec.ts` -- scan all `.html` and inline templates: fail on literal text nodes and on literal `aria-label`/`placeholder`/`title`/`alt` attributes
- `eslint.config.js` -- `features/auth` may import `core/*`, `shared`, `domain`; keep layer table intact

## Tasks & Acceptance

**Execution:**
- [ ] `src/app/domain/session.ts`, `auth-error.ts` + spec -- types and error mapper with every code row of the matrix
- [ ] `src/app/core/state/session.state.ts`, `session-scope.ts`, `session.guard.ts` + specs -- epoch increments, resets run, stale epoch rejected, guard waits out `unknown`
- [ ] `src/app/core/data/auth-backend.ts`, `auth.service.ts` + spec with a fake backend -- state transitions, signIn ok and error codes, double submit
- [ ] `src/app/shared/strings.ts`, `language.service.ts` + spec -- `it` and `en` complete (type-enforced), `<html lang>` follows the signal
- [ ] `src/app/features/auth/login.component.*` + spec, `categories.component.ts`, routes, `app.config.ts`, `styles.css` -- screen, Show/Hide, errors, navigation
- [ ] `src/app/template-text.spec.ts` -- AD-15(e) scan, proven by an in-test negative fixture
- [ ] Verify with `npx ng build`, `npm run check`; optionally one manual emulator sign-in (`npm run emulators` + create a user via the Auth emulator REST API) if JDK allows

**Acceptance Criteria:**
- Given a signed-in session, when the app restarts, then the guard lets the user in without login (backend-reported uid).
- Given no session, when any route other than `/login` is opened, then the user lands on `/login`.
- Given `npm run check`, when it runs, then guard, transitions, error mapping, strings and the template scan are covered and pass.

## Implementation Notes

See Design Notes. Login hero/form split at 900px as in the mockup. `node` types added to tsconfig.spec.json for the template scan. Manual emulator sign-in not run; sign-in is tested with a fake AuthBackend.

## Spec Change Log

## Review Triage Log

- patch (medium): `busy` stuck if backend.signIn throws synchronously -- fixed (Promise.resolve().then).
- patch (medium): onAuthStateChanged without error callback could leave session `unknown` -- fixed (reports signedOut).
- patch (medium): route wiring and guard attachment untested -- fixed (`app.routes.spec.ts`).
- patch (low): Italian agreement ("non corretti"), contradictory aria-pressed on Show/Hide -- fixed.
- defer (low/medium): signOut rejection unhandled; initFirebase throw at bootstrap; epoch bumped in effect (not synchronous), `isCurrent` not yet used by any store (no stores exist yet); no reactive redirect on sign-out while on a route and no returnUrl (Story 1.3 / later); app-initializer and FirebaseAuthBackend mapping tests; scan regex limits; too-many-requests/user-disabled map to `unknown` by spec; dark tokens (Epic 6).
- false: "eslint layer rule not updated" (layer table already allows features -> core/shared/domain; lint passes).

## Design Notes

Decisions taken without the user (keep the product small): Material `*Intl` providers are deferred to the first story that uses a Material component (none here; recorded in deferred-work); the Login language switcher is left to Story 6.1; `AuthBackend` is an abstract class used as DI token so tests inject a fake and `core/data` stays the only firebase importer.

## Verification

**Commands:**
- `npx ng build` -- expected: success
- `npm run check` -- expected: pass
