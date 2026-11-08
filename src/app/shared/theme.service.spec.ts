import { TestBed } from '@angular/core/testing';
import { PreferencesBackend } from '../core/data/preferences-backend';
import { PreferencesStore } from './preferences.store';
import { ThemeService } from './theme.service';
import { tokensFor } from './theme';

describe('ThemeService', () => {
  afterEach(() => {
    localStorage.removeItem('memoit.theme');
    document.documentElement.removeAttribute('style');
  });

  it('writes the tokens onto <html> and follows the chosen scheme', () => {
    localStorage.removeItem('memoit.theme');
    TestBed.configureTestingModule({ providers: [{ provide: PreferencesBackend, useValue: { load: async () => null, save: async () => undefined } }] });
    TestBed.inject(ThemeService);
    const store = TestBed.inject(PreferencesStore);
    TestBed.tick();
    const root = document.documentElement;
    store.previewAppearance({ accent: 'green', scheme: 'dark' });
    TestBed.tick();
    expect(root.dataset['scheme']).toBe('dark');
    expect(root.style.getPropertyValue('--primary')).toBe(tokensFor({ accent: 'green' }, 'dark')['primary']);
    store.previewAppearance({ accent: 'green', scheme: 'light' });
    TestBed.tick();
    expect(root.style.getPropertyValue('--surface')).toBe(tokensFor({ accent: 'green' }, 'light')['surface']);
  });

  it('follows the OS preference for system and its changes', () => {
    let listener: ((e: { matches: boolean }) => void) | undefined;
    const mq = {
      matches: true,
      addEventListener: (_t: string, l: (e: { matches: boolean }) => void) => (listener = l),
      removeEventListener: () => undefined,
    };
    vi.stubGlobal('matchMedia', () => mq);
    try {
      localStorage.removeItem('memoit.theme');
      TestBed.configureTestingModule({
        providers: [{ provide: PreferencesBackend, useValue: { load: async () => null, save: async () => undefined } }],
      });
      TestBed.inject(ThemeService);
      TestBed.tick();
      expect(document.documentElement.dataset['scheme']).toBe('dark');
      listener?.({ matches: false });
      TestBed.tick();
      expect(document.documentElement.dataset['scheme']).toBe('light');
    } finally {
      vi.unstubAllGlobals();
    }
  });
});
