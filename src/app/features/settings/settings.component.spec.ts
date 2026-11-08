import { provideRouter } from '@angular/router';
import { TestBed } from '@angular/core/testing';
import { AuthBackend } from '../../core/data/auth-backend';
import { PreferencesBackend } from '../../core/data/preferences-backend';
import { SessionState } from '../../core/state/session.state';
import { PreferencesStore } from '../../shared/preferences.store';
import { LanguageService } from '../../shared/language.service';
import { SettingsComponent } from './settings.component';

const authStub = {
  provide: AuthBackend,
  useValue: { onChange: () => () => undefined, signIn: async () => '', signOut: async () => undefined },
};

describe('SettingsComponent', () => {
  afterEach(() => {
    localStorage.removeItem('memoit.language');
    localStorage.removeItem('memoit.theme');
  });

  it('switches the whole UI language', async () => {
    localStorage.removeItem('memoit.language');
    const saved: unknown[] = [];
    TestBed.configureTestingModule({
      providers: [
        authStub,
        provideRouter([]),
        {
          provide: PreferencesBackend,
          useValue: { load: async () => null, save: async (_u: string, p: unknown) => void saved.push(p) },
        },
      ],
    });
    TestBed.inject(SessionState).session.set({ kind: 'signedIn', uid: 'u1' });
    const fixture = TestBed.createComponent(SettingsComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const langButtons = () => el.querySelectorAll('.segmented')[1].querySelectorAll('button');
    const buttons = langButtons();
    expect(buttons[0].getAttribute('aria-pressed')).toBe('true');
    buttons[1].click();
    await fixture.whenStable();
    expect(TestBed.inject(LanguageService).language()).toBe('it');
    expect(el.querySelector('h1')?.textContent).toBe('Impostazioni');
    expect(langButtons()[1].getAttribute('aria-pressed')).toBe('true');
    expect(saved.length).toBe(1);
  });

  it('recolors on a swatch and Appearance choice and saves without a Save button', async () => {
    localStorage.removeItem('memoit.theme');
    const saved: { accent: string; scheme: string }[] = [];
    TestBed.configureTestingModule({
      providers: [
        authStub,
        provideRouter([]),
        {
          provide: PreferencesBackend,
          useValue: { load: async () => null, save: async (_u: string, p: never) => void saved.push(p) },
        },
      ],
    });
    TestBed.inject(SessionState).session.set({ kind: 'signedIn', uid: 'u1' });
    const store = TestBed.inject(PreferencesStore);
    const fixture = TestBed.createComponent(SettingsComponent);
    await fixture.whenStable();
    const el: HTMLElement = fixture.nativeElement;
    const swatches = el.querySelectorAll<HTMLButtonElement>('.swatch');
    expect(swatches.length).toBe(9);
    swatches[3].click();
    await fixture.whenStable();
    expect(store.appearance().accent).toBe('green');
    expect(swatches[3].getAttribute('aria-pressed')).toBe('true');
    const seg = [...el.querySelectorAll<HTMLButtonElement>('.seg')].find((b) => b.textContent?.trim() === 'Dark');
    seg?.click();
    await fixture.whenStable();
    expect(saved.at(-1)).toEqual({ accent: 'green', scheme: 'dark', language: 'en' });
    expect(el.querySelectorAll('input[type=range]').length).toBe(1);
    const hue = el.querySelector<HTMLInputElement>('input[type=range]')!;
    hue.value = '200';
    hue.dispatchEvent(new Event('input'));
    expect(store.appearance().hue).toBe(200);
    const before = saved.length;
    hue.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(saved.length).toBe(before + 1);
    expect(el.querySelectorAll('input[type=range]').length).toBe(2);
    const chroma = el.querySelectorAll<HTMLInputElement>('input[type=range]')[1];
    chroma.value = '0.2';
    chroma.dispatchEvent(new Event('input'));
    expect(store.appearance().chroma).toBeCloseTo(0.2);
    expect(store.appearance().hue).toBe(200);
    chroma.dispatchEvent(new Event('change'));
    await fixture.whenStable();
    expect(saved.length).toBe(before + 2);
  });
});
