# Epic 1 Context: Secure foundation and sign-in

<!-- Compiled from planning artifacts. Edit freely. Regenerate with compile-epic-context if planning docs change. -->

## Goal

Deliver a running, tested Angular app wired to the Firebase Emulator Suite, where a User can sign in with an account created in the Firebase console and stay signed in. Firestore security rules and their emulator tests must exist before any feature stores real data, so per-user isolation is proven first.

## Stories

- Story 1.1: Angular 22 scaffold and Firestore rules with emulator tests
- Story 1.2: Sign in with a persistent session
- Story 1.3: App shell, responsive navigation and sign out

## Requirements & Constraints

- Login with email and password, logout, session persists across restarts until logout. Unauthenticated visitors see only the login screen. Wrong credentials show an error and grant no access. No registration, no password-reset UI (accounts are created in the Firebase console).
- A User can read and write only their own data; cross-user and unauthenticated access are denied, proven by a rules test suite.
- A connection is required (no offline). No server code of any kind (no Cloud Functions, no `functions/` directory). Local development uses the Emulator Suite only.
- Mobile-first and responsive: compact under 768 px, medium 768-1199, expanded 1200+.
- Accessibility floor: 48 px targets, focus trap and restore for menus and dialogs, polite live region, reduced motion.
- Out of scope for v1: notifications, "keep me signed in", registration, password reset.

## Technical Decisions

- Stack: Angular 22.2.x (standalone, OnPush, signals, zoneless-compatible), TypeScript ~6.0.3, Angular Material and CDK 22.2.6 (equal versions), firebase 13.2.0 modular (no `@angular/fire`), Vitest, Playwright, ESLint with angular-eslint, `@firebase/rules-unit-testing`, firebase-tools. Reverify versions at scaffold and note differences. Node >= 24.15, JDK >= 21 for emulators.
- Layers and allowed imports: `domain` (pure, imports nothing) <- `core/state` <- `core/data` (only place allowed to import `firebase/*`) <- `shared` <- `features` <- `shell`. Layout: `src/app/{features,shell,domain,core/state,core/data,shared}`, `src/environments`, `tests/rules`, `e2e`, `firestore.rules`, `firebase.json`.
- Environments: `local` (emulators for Auth and Firestore; `firebase.ts` connects to emulators only when local) and `prod` (gitignored config with committed example; prod build fails with a clear message if missing). Repository under git from scaffold; `.gitignore` excludes node_modules, prod env file, emulator data.
- `npm run check` (ESLint, unit tests, rules tests) is the only gate; `npm run deploy` runs it then deploys rules, then Hosting. Do not execute deploy or create a Firebase project in this epic. ESLint enforces: import table, no `firebase/*` outside `core/data`, no Angular/DOM in `domain`, no `functions/` directory; a Vitest scan forbids literal UI text in templates.
- Data model: `users/{uid}/categories/{id}`, `users/{uid}/items/{id}`, `users/{uid}/preferences/app`. Rules allow only the owner and deny every other path. Field rules: category `name` 1-60, `stateLabel` 1-16, `reportable` boolean; item `title` 1-120, `description` <= 4000, `done` boolean, `priority` low|medium|high, `deadline` timestamp, `value` is number, `categoryId` must reference an existing Category of the same uid; keys are a subset of the allowed fields; `updatedAt == request.time`; `createdAt` unchanged on update; preferences: accent preset id or `custom` with hue 0-360 and chroma 0-0.3, scheme light|dark|system, language it|en. Test with valid and invalid vectors. No feature reads or writes Firestore in this epic.
- Session lifecycle: `AuthService` exposes tri-state signal `unknown | signedOut | signedIn(uid)` plus `signIn`/`signOut`. One route guard waits out `unknown`, redirects to `/login`, protects all routes except `/login`. `SessionScope` increments `sessionEpoch` on every session change, resets the stores and local view state of the previous uid; stale-epoch results are discarded. Auth errors map to `invalid-credentials | invalid-email | network | unknown`; raw Firebase text is never shown.
- `shared/strings.ts`: typed `it`/`en` dictionary (missing key fails compile), Material `*Intl` providers, default English, `<html lang>` follows the Language signal.
- Routes table lives in `shell`: `/login`, `/categories`, `/c/:categoryId`, `/c/:categoryId/settings`, `/c/:categoryId/i/new`, `/c/:categoryId/i/:itemId`, `/report`, `/settings`; malformed or unknown ids redirect to `/categories`. `LayoutService` exposes the `windowClass` signal; no component measures the window itself.
- Conventions: kebab-case files, `name.component.ts`, `name.service.ts`/`name.store.ts`, selector prefix `memo-`, standalone only, specs next to files. Mockups are a composition reference only, never copied; text goes to `strings.ts`, colors from tokens.

## UX & Interaction Patterns

- Login (reference: `login.html`): split layout on expanded, tonal header on compact, password Show/Hide, no registration or reset link, inline error message.
- Navigation by window class: bottom bar (<768), rail (768-1199), drawer (1200+); destinations Categories, Report, Settings with `aria-current`; `/report` and `/settings` are placeholders in this epic.
- Account menu on every screen except Login: avatar opens name, email, Settings, Sign out; closes on outside tap, Escape, resize; focus returns to avatar on Escape. Sign out is also the last rail/drawer entry; it calls only `AuthService.signOut()` with no confirmation, lands on `/login`, and shows the snackbar "You have been signed out".
- Snackbar: 5 s, one line, one polite `aria-live` region, a new one replaces the old, never stacks.
- Voice: short, plain, no exclamation marks, no emoji.

## Cross-Story Dependencies

- 1.1 comes first: scaffold, rules and check gate underpin everything; later epics must not store data before its rules tests pass.
- 1.2 depends on 1.1 (environments, emulator, `core/data`) and introduces `AuthService`, `SessionScope`, the guard and `strings.ts` that 1.3 and later epics reuse.
- 1.3 depends on 1.2 (session, guard, strings) and provides the shell, route table, snackbar and `LayoutService` used by Epics 2-6; Report and Settings placeholders are replaced in Epics 5 and 6.
