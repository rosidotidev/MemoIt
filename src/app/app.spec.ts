import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { App } from './app';
import { PreferencesBackend } from './core/data/preferences-backend';
import { PreferencesStore } from './shared/preferences.store';

describe('App', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [App],
      providers: [provideRouter([]), { provide: PreferencesBackend, useValue: { load: async () => null, save: async () => undefined } }],
    }).compileComponents();
  });

  it('creates the shell with a router outlet', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const el = fixture.nativeElement as HTMLElement;
    expect(fixture.componentInstance).toBeTruthy();
    expect(el.querySelector('router-outlet')).not.toBeNull();
  });

  it('applies the chosen theme to the document', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const store = TestBed.inject(PreferencesStore);
    store.previewAppearance({ accent: 'green', scheme: 'dark' });
    TestBed.tick();
    expect(document.documentElement.dataset['scheme']).toBe('dark');
    store.previewAppearance({ accent: 'green', scheme: 'light' });
    TestBed.tick();
    expect(document.documentElement.dataset['scheme']).toBe('light');
  });
});
