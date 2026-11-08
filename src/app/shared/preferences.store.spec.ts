import { TestBed } from '@angular/core/testing';
import { DEFAULT_PREFERENCES, type Preferences } from '../domain/preferences';
import { LanguageService } from './language.service';
import { SnackbarService } from './snackbar.service';
import { SessionState } from '../core/state/session.state';
import { PreferencesBackend, fromPrefsDoc } from '../core/data/preferences-backend';
import { PreferencesStore } from './preferences.store';

class FakePrefsBackend extends PreferencesBackend {
  stored: Preferences | null = null;
  saved: Preferences[] = [];
  saveError = false;
  loadGate: Promise<void> = Promise.resolve();
  async load(): Promise<Preferences | null> {
    await this.loadGate;
    return this.stored;
  }
  async save(_uid: string, p: Preferences): Promise<void> {
    if (this.saveError) {
      throw new Error('x');
    }
    this.saved.push(p);
  }
}

function setup(backend = new FakePrefsBackend()) {
  localStorage.removeItem('memoit.language');
  localStorage.removeItem('memoit.theme');
  TestBed.configureTestingModule({ providers: [{ provide: PreferencesBackend, useValue: backend }] });
  const store = TestBed.inject(PreferencesStore);
  const lang = TestBed.inject(LanguageService);
  TestBed.inject(SessionState).session.set({ kind: 'signedIn', uid: 'u1' });
  TestBed.tick();
  return { store, lang, backend };
}

const flush = () => new Promise((r) => setTimeout(r));

describe('PreferencesStore', () => {
  afterEach(() => {
    localStorage.removeItem('memoit.language');
    localStorage.removeItem('memoit.theme');
  });

  it('applies a stored language and mirrors it', async () => {
    const backend = new FakePrefsBackend();
    backend.stored = { ...DEFAULT_PREFERENCES, language: 'it' };
    const { lang } = setup(backend);
    await flush();
    expect(lang.language()).toBe('it');
    expect(localStorage.getItem('memoit.language')).toBe('it');
  });

  it('changes language at once, saves the full document and mirrors it', async () => {
    const { store, lang, backend } = setup();
    await flush();
    await store.setLanguage('it');
    expect(lang.language()).toBe('it');
    expect(backend.saved[0]).toEqual({ ...DEFAULT_PREFERENCES, language: 'it' });
    expect(localStorage.getItem('memoit.language')).toBe('it');
  });

  it('rolls back with a visible error when the save fails', async () => {
    const { store, lang, backend } = setup();
    await flush();
    backend.saveError = true;
    await store.setLanguage('it');
    expect(lang.language()).toBe('en');
    expect(localStorage.getItem('memoit.language')).toBe('en');
    expect(TestBed.inject(SnackbarService).message()).toContain('Could not save');
  });

  it('never lets a late load overwrite a later choice', async () => {
    const backend = new FakePrefsBackend();
    backend.stored = { ...DEFAULT_PREFERENCES, language: 'it' };
    let release!: () => void;
    backend.loadGate = new Promise((r) => (release = r));
    const { store, lang } = setup(backend);
    const first = store.setLanguage('it');
    const second = store.setLanguage('en');
    release();
    await Promise.all([first, second]);
    await flush();
    expect(lang.language()).toBe('en');
  });

  it('keeps the stored appearance when the first choice comes before the load', async () => {
    const backend = new FakePrefsBackend();
    backend.stored = { accent: 'custom', hue: 120, chroma: 0.1, scheme: 'dark', language: 'en' };
    let release!: () => void;
    backend.loadGate = new Promise((r) => (release = r));
    const { store, lang } = setup(backend);
    const p = store.setLanguage('it');
    release();
    await p;
    expect(lang.language()).toBe('it');
    expect(store.appearance().accent).toBe('custom');
    expect(backend.saved[0]).toEqual({ accent: 'custom', hue: 120, chroma: 0.1, scheme: 'dark', language: 'it' });
  });

  it('never writes the other choice stale when saves overlap', async () => {
    const { store, backend } = setup();
    await flush();
    const a = store.setLanguage('it');
    const b = store.setAppearance({ accent: 'teal', scheme: 'dark' });
    await Promise.all([a, b]);
    expect(backend.saved.at(-1)).toEqual({ accent: 'teal', scheme: 'dark', language: 'it' });
  });

  it('keeps the look on sign-out, resets it for another user, and drops a late load of the previous user', async () => {
    const backend = new FakePrefsBackend();
    backend.stored = { accent: 'rose', scheme: 'dark', language: 'it' };
    const { store, lang } = setup(backend);
    await flush();
    expect(store.appearance().accent).toBe('rose');
    expect(lang.language()).toBe('it');
    const session = TestBed.inject(SessionState).session;
    session.set({ kind: 'signedOut' });
    TestBed.tick();
    expect(store.appearance()).toEqual({ accent: 'rose', scheme: 'dark' });
    expect(lang.language()).toBe('it');

    // user B signs in while user A's load is still pending, then user C replaces B
    let release!: () => void;
    backend.loadGate = new Promise((r) => (release = r));
    backend.stored = { accent: 'teal', scheme: 'light', language: 'it' };
    session.set({ kind: 'signedIn', uid: 'u2' });
    TestBed.tick();
    expect(store.appearance().accent).toBe('indigo');
    session.set({ kind: 'signedIn', uid: 'u3' });
    TestBed.tick();
    release();
    await flush();
    expect(store.appearance().accent).toBe('teal');
    expect(store.appearance().accent).not.toBe('rose');
  });

  it('reverts an unsaved preview', async () => {
    const { store } = setup();
    await flush();
    store.previewAppearance({ accent: 'rose', scheme: 'dark' });
    store.revertPreview();
    expect(store.appearance()).toEqual({ accent: 'indigo', scheme: 'system' });
  });

  it('applies a stored appearance and mirrors it', async () => {
    const backend = new FakePrefsBackend();
    backend.stored = { accent: 'custom', hue: 120, chroma: 0.1, scheme: 'dark', language: 'en' };
    const { store } = setup(backend);
    await flush();
    expect(store.appearance()).toEqual({ accent: 'custom', hue: 120, chroma: 0.1, scheme: 'dark' });
    expect(JSON.parse(localStorage.getItem('memoit.theme') ?? '{}').scheme).toBe('dark');
  });

  it('saves a chosen appearance as the full document, previews without saving', async () => {
    const { store, backend } = setup();
    await flush();
    store.previewAppearance({ accent: 'teal', scheme: 'system' });
    expect(store.appearance().accent).toBe('teal');
    expect(backend.saved.length).toBe(0);
    await store.setAppearance({ accent: 'teal', scheme: 'dark' });
    expect(backend.saved[0]).toEqual({ accent: 'teal', scheme: 'dark', language: 'en' });
  });

  it('rolls an appearance back to the last saved one with a visible error', async () => {
    const { store, backend } = setup();
    await flush();
    backend.saveError = true;
    store.previewAppearance({ accent: 'rose', scheme: 'system' });
    await store.setAppearance({ accent: 'rose', scheme: 'system' });
    expect(store.appearance()).toEqual({ accent: 'indigo', scheme: 'system' });
    expect(TestBed.inject(SnackbarService).message()).toContain('Could not save');
  });

  it('keeps the saved appearance when the language changes', async () => {
    const backend = new FakePrefsBackend();
    backend.stored = { accent: 'custom', hue: 120, chroma: 0.1, scheme: 'dark', language: 'en' };
    const { store } = setup(backend);
    await flush();
    await store.setLanguage('it');
    expect(backend.saved[0]).toEqual({ accent: 'custom', hue: 120, chroma: 0.1, scheme: 'dark', language: 'it' });
  });

  it('reads documents defensively', () => {
    expect(fromPrefsDoc({ accent: 'teal', scheme: 'dark', language: 'xx' })).toEqual({
      accent: 'teal',
      scheme: 'dark',
      language: 'en',
    });
  });
});
