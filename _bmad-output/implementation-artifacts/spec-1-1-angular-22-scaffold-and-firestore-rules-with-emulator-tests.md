---
title: '1-1 Angular 22 scaffold and Firestore rules with emulator tests'
type: 'feature'
created: '2026-11-06'
status: 'done'
route: 'dispatch'
baseline_commit: '28f30a090b3e2a215da1d52b9735be913c2b0520'
review_loop_iteration: 0
context:
  - '{project-root}/_bmad-output/implementation-artifacts/epic-1-context.md'
  - '{project-root}/_bmad-output/planning-artifacts/architecture/architecture-bmad612_home-2026-11-06/ARCHITECTURE-SPINE.md'
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** The repository has no app code. No real data may be stored before per-user isolation is proven by tests (FR2, NFR1).

**Approach:** Scaffold an Angular 22 standalone app (Vitest, ESLint, layout of the Structural Seed) wired to the Firebase Emulator Suite only, and write `firestore.rules` with emulator tests covering AD-10, plus an `npm run check` gate. No feature code, no Firestore reads or writes by the app.

## Boundaries & Constraints

**Always:** Reverify versions on the npm registry and record differences in Implementation Notes. Pin: Angular 22.2.x, TypeScript ~6.0.3, Material and CDK equal (22.2.6), firebase 13.2.0 (modular, no `@angular/fire`). Standalone, OnPush, signals, zoneless-compatible. Selectors prefixed `memo-`. Tests as `*.spec.ts` next to files; rules tests in `tests/rules/`. `.gitignore` excludes node_modules, the prod environment file and emulator data. Rules follow AD-10 exactly.

**Never:** Cloud Functions, a `functions/` directory, any server code (NFR7). No Firebase project, no login to Firebase, no deploy (`npm run deploy` exists but is not run). No feature screens, stores or Firestore access by the app. No `@angular/fire`.

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| Unauthenticated | any read/write on any path | denied | N/A |
| Cross-user | user A on `users/B/...` categories, items, preferences | denied | N/A |
| Unknown path | signed-in user on any other path | denied | N/A |
| Valid Category | name 1-60, stateLabel 1-16, reportable bool, createdAt, updatedAt == request.time | create/update allowed | N/A |
| Invalid Category | empty or 61-char name, stateLabel 17 chars, non-bool reportable, extra key, updatedAt not request.time, createdAt changed on update | denied | N/A |
| Valid Item | title 1-120, description <= 4000, done bool, priority in low/medium/high, deadline timestamp, value number, categoryId of an existing own Category | allowed | N/A |
| Invalid Item | empty or 121-char title, 4001-char description, priority "urgent", deadline non-timestamp, value string, unknown key, missing/foreign Category, createdAt changed | denied | N/A |
| Preferences | accent preset or custom with hue 0-360 and chroma 0-0.3, scheme light/dark/system, language it/en | allowed; out-of-range or other values denied | N/A |
| Prod build, file missing | `src/environments/environment.prod.ts` absent | build fails with a clear message | message names the example file to copy |

</frozen-after-approval>

## Code Map

- `package.json`, `angular.json`, `tsconfig*.json` -- new; scripts `start`, `build`, `test`, `lint`, `test:rules`, `check`, `deploy`, `emulators`
- `src/environments/environment.ts` (local, `useEmulators: true`), `environment.prod.example.ts` (committed), `environment.prod.ts` (gitignored; prod `fileReplacements`)
- `src/app/core/data/firebase.ts` -- initializes the app, connects Auth (9099) and Firestore (8080) emulators only when local; not imported by any feature yet
- `src/app/{features/*,shell,domain,core/state,core/data,shared}` -- Structural Seed layout; `.gitkeep` or minimal placeholders; `app.ts` minimal shell
- `firestore.rules`, `firebase.json` (Auth + Firestore emulators, rules path, no functions), `tests/rules/*.spec.ts` (`@firebase/rules-unit-testing`, own Vitest config, run via `firebase emulators:exec`)
- `eslint.config.js` -- no-restricted-imports (AD-1, allowed-imports table), no Angular/DOM in `domain`; `scripts/check-no-functions.mjs` fails if a `functions/` dir exists
- `.gitignore` -- add environment.prod.ts, .firebase, emulator data, firebase-debug logs

## Tasks & Acceptance

**Execution:**
- [x] scaffold Angular app in the repo root (preserve existing `_bmad*`, `doc`, notes) -- Vitest as test runner
- [x] environments + `firebase.ts` + prod build guard -- AR3
- [x] `firestore.rules`, `firebase.json`, rules tests with valid and invalid vectors per matrix -- FR2, SM-3
- [x] ESLint rules + functions-dir check + `npm run check` and `npm run deploy` -- AR4, AR5
- [x] a small unit test of the app shell/firebase config so `ng test` is non-empty

**Acceptance Criteria:**
- Given the repo, when `ng build` and `ng test` run, then both pass.
- Given JDK 21, when `npm run test:rules` runs, then all rules tests pass against the emulator.
- Given `npm run check`, when a violation (firebase import outside `core/data`, DOM in `domain`, `functions/`) exists, then it fails; otherwise passes.
- Given no prod file, when the production build runs, then it fails with a clear message.

## Implementation Notes

- Registry reverify (2026-11-06): @angular/core latest is 22.2.5 (CLI 22.2.6, Material/CDK 22.2.6, pinned exactly); TypeScript latest is 7.0.2, pinned ~6.0.3 per spec (installed 6.0.3); firebase 13.2.0 exact; vitest 5.1.0, jsdom 30 (scaffold), eslint 10.14, angular-eslint 22.6.0, @firebase/rules-unit-testing 6.0.0, firebase-tools 15.35.0.
- `ng build` defaults to the development configuration so it passes without the prod file. The prod guard is `npm run build:prod` (checks `environment.prod.ts`, names the example file); `npm run deploy` uses it. A bare `ng build -c production` fails with Angular's generic missing-file error.
- Rules tests run via `firebase emulators:exec --only firestore` (Auth emulator not needed by rules tests); `vitest.rules.config.mts`.
- Preferences `updatedAt` is optional (must equal request.time when present); `accent` is any 1-32 char string, `custom` requires hue/chroma, presets forbid them.

## Spec Change Log

## Review Triage Log

- patch (medium): initFirebase not idempotent / not tested -- fixed (memoised, demo- guard, tests).
- patch (medium): no strict/strictTemplates -- fixed.
- patch (low): Angular core pinned loosely, deploy order, firebase imports outside core/data, missing negative rules vectors -- fixed.
- defer (low): no negative-fixture tests for ESLint layer rules and scripts; prod guard only via npm run build:prod; check-prod-env does not detect placeholders; value NaN/Infinity (AD-10 says `is number`); text-scan and date/number lint rules (later stories); .firebaserc absent (no real project by design).
- false: orphan Items on Category delete (AD-6 cascades in the client; no rule requirement).
- false: version pinning "unreproducible" (lockfile exists, untracked in diff only).

## Verification

**Commands:**
- `npx ng build` -- expected: success
- `npx ng test --watch=false` -- expected: pass
- `npm run test:rules` -- expected: pass
- `npm run check` -- expected: pass
