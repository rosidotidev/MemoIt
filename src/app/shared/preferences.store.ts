import { Injectable, effect, inject, signal, untracked } from '@angular/core';
import { DEFAULT_PREFERENCES, type Appearance, type Preferences, type Scheme } from '../domain/preferences';
import { LanguageService } from './language.service';
import { SnackbarService } from './snackbar.service';
import type { Language } from './strings';
import { SessionState } from '../core/state/session.state';
import { PreferencesBackend } from '../core/data/preferences-backend';

const LANGUAGE_KEY = 'memoit.language';
const THEME_KEY = 'memoit.theme';

const pickAppearance = (p: Appearance): Appearance =>
  p.accent === 'custom' && p.hue !== undefined && p.chroma !== undefined
    ? { accent: p.accent, hue: p.hue, chroma: p.chroma, scheme: p.scheme }
    : { accent: p.accent, scheme: p.scheme };

/** Appearance mirrored to localStorage so the first paint has no flash. */
function readThemeMirror(): Appearance {
  try {
    const v = JSON.parse(localStorage.getItem(THEME_KEY) ?? 'null') as Partial<Appearance> | null;
    if (v && typeof v.accent === 'string' && v.accent) {
      const scheme: Scheme = v.scheme === 'light' || v.scheme === 'dark' ? v.scheme : 'system';
      return pickAppearance({ accent: v.accent, hue: v.hue, chroma: v.chroma, scheme });
    }
  } catch {
    // unreadable mirror: use the defaults
  }
  return pickAppearance(DEFAULT_PREFERENCES);
}

/** Persists preferences as one full document and mirrors Language to localStorage. */
@Injectable({ providedIn: 'root' })
export class PreferencesStore {
  private readonly backend = inject(PreferencesBackend);
  private readonly lang = inject(LanguageService);
  private readonly snackbar = inject(SnackbarService);
  private readonly session = inject(SessionState).session;
  private uid: string | null = null;
  private lastUid: string | null = null;
  /** Bumped on every identity change; a late load, save or rollback of another identity is dropped. */
  private idSeq = 0;
  /** The latest choices, applied optimistically: the base of every document written. */
  private prefs: Preferences = DEFAULT_PREFERENCES;
  /** The last document known to be stored (or the mirror before the first load): rollback target only. */
  private saved: Preferences = DEFAULT_PREFERENCES;
  /** Resolves (never rejects) when the first load of the current identity is over. */
  private loading: Promise<void> = Promise.resolve();
  private touched = { language: false, appearance: false };
  /** The appearance on screen (may be a live preview that is not saved yet). */
  readonly appearance = signal<Appearance>(readThemeMirror());

  constructor() {
    effect(() => {
      const s = this.session();
      const uid = s.kind === 'signedIn' ? s.uid : null;
      untracked(() => this.switchTo(uid));
    });
  }

  /** Applies the choice at once; rolls back with a visible error if the save fails. */
  async setLanguage(language: Language): Promise<void> {
    const uid = this.uid;
    if (!uid || language === this.lang.language()) {
      return;
    }
    const id = this.idSeq;
    this.touched.language = true;
    this.apply(language);
    this.prefs = { ...this.prefs, language };
    await this.loading;
    if (id !== this.idSeq) {
      return;
    }
    try {
      await this.backend.save(uid, this.prefs);
      if (id === this.idSeq) {
        this.saved = { ...this.saved, language };
      }
    } catch {
      if (id === this.idSeq && this.prefs.language === language) {
        this.prefs = { ...this.prefs, language: this.saved.language };
        this.apply(this.saved.language);
      }
      this.snackbar.show(this.lang.strings().settings.saveError);
    }
  }

  /** Shows an appearance at once without saving (slider drag). */
  previewAppearance(next: Appearance): void {
    this.appearance.set(pickAppearance(next));
  }

  /** Drops an unsaved preview: back to the last chosen appearance. */
  revertPreview(): void {
    this.appearance.set(pickAppearance(this.prefs));
  }

  /** Applies and saves the appearance; rolls back to the last saved one with a visible error on failure. */
  async setAppearance(raw: Appearance): Promise<void> {
    const uid = this.uid;
    const next = pickAppearance(raw);
    this.appearance.set(next);
    this.mirrorTheme(next);
    this.touched.appearance = true;
    this.prefs = { ...next, language: this.prefs.language };
    if (!uid) {
      return;
    }
    const id = this.idSeq;
    const mine = JSON.stringify(next);
    await this.loading;
    if (id !== this.idSeq) {
      return;
    }
    try {
      await this.backend.save(uid, this.prefs);
      if (id === this.idSeq) {
        this.saved = { ...next, language: this.saved.language };
      }
    } catch {
      if (id === this.idSeq && JSON.stringify(pickAppearance(this.prefs)) === mine) {
        const previous = pickAppearance(this.saved);
        this.prefs = { ...previous, language: this.prefs.language };
        this.appearance.set(previous);
        this.mirrorTheme(previous);
      }
      this.snackbar.show(this.lang.strings().settings.saveError);
    }
  }

  private mirrorTheme(a: Appearance): void {
    try {
      localStorage.setItem(THEME_KEY, JSON.stringify(a));
    } catch {
      // storage unavailable: the mirror is only an optimisation
    }
  }

  private apply(language: Language): void {
    this.lang.language.set(language);
    try {
      localStorage.setItem(LANGUAGE_KEY, language);
    } catch {
      // storage unavailable: the mirror is only an optimisation
    }
  }

  private switchTo(uid: string | null): void {
    if (uid === this.uid) {
      return;
    }
    if (uid !== null && this.lastUid !== null && uid !== this.lastUid) {
      // another user: never carry the previous user's choices over (a plain sign-out keeps the look)
      this.appearance.set(pickAppearance(DEFAULT_PREFERENCES));
      this.mirrorTheme(pickAppearance(DEFAULT_PREFERENCES));
      this.apply(DEFAULT_PREFERENCES.language);
    }
    this.uid = uid;
    if (uid !== null) {
      this.lastUid = uid;
    }
    const id = ++this.idSeq;
    this.touched = { language: false, appearance: false };
    this.prefs = { ...DEFAULT_PREFERENCES, ...this.appearance(), language: this.lang.language() };
    this.saved = this.prefs;
    this.loading = Promise.resolve();
    if (!uid) {
      return;
    }
    this.loading = this.backend.load(uid).then(
      (loaded) => {
        if (id !== this.idSeq || !loaded) {
          return;
        }
        this.saved = loaded;
        // fields the user already chose in the meantime win; the rest come from the stored document
        const appearance = pickAppearance(this.touched.appearance ? this.prefs : loaded);
        const language = this.touched.language ? this.prefs.language : loaded.language;
        this.prefs = { ...appearance, language };
        if (!this.touched.language) {
          this.apply(language);
        }
        if (!this.touched.appearance) {
          this.appearance.set(appearance);
          this.mirrorTheme(appearance);
        }
      },
      () => undefined, // keep the mirrored values; the next choice writes the full document
    );
  }
}
