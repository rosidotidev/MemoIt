---
title: 'Story 6.1: Choose language'
type: feature
status: in-review
---

## Intent
User switches Italian/English in Settings; choice applies at once, persists in `users/{uid}/preferences/app` and is mirrored to localStorage (no flash).

## Code Map
- `src/app/domain/preferences.ts`: Preferences, Language, defaults (indigo, system, en).
- `src/app/core/data/preferences-backend.ts`: abstract backend + Firestore impl (full document, defensive read).
- `src/app/shared/preferences.store.ts`: optimistic setLanguage, seq guard (late load never overwrites a later choice), rollback + snackbar on failure.
- `src/app/shared/language.service.ts`: initial value from the localStorage mirror.
- `src/app/features/settings/settings.component.ts`: segmented language control.
- Rules from 1.1 already accept `language in [it, en]`; unchanged.

## Design Notes (decided without the user, keeping the product small)
- Store lives in `shared/` (layer table forbids core/data -> shared); `Language` type moved to domain, re-exported by strings.ts.
- Material built-in text/dates/numbers: the app has no Material date/paginator components; dates and numbers already follow `LanguageService.language()` via Intl.
- Accent/scheme are carried through the full document unchanged until 6.2.
- No Save button, no loading state for preferences.
