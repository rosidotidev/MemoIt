import { DOCUMENT } from '@angular/common';
import { DestroyRef, Injectable, effect, inject, signal } from '@angular/core';
import { PreferencesStore } from './preferences.store';
import { resolveScheme, tokensFor } from './theme';

/** Bumped each time the theme tokens are rewritten, so token readers (the chart) can re-render. */
@Injectable({ providedIn: 'root' })
export class ThemeVersion {
  readonly value = signal(0);
}

/** Writes the Material role tokens for the chosen accent and scheme onto `<html>`. */
@Injectable({ providedIn: 'root' })
export class ThemeService {
  private readonly doc = inject(DOCUMENT);
  private readonly appearance = inject(PreferencesStore).appearance;
  private readonly version = inject(ThemeVersion).value;
  private readonly systemDark = signal(false);

  constructor() {
    const mq = typeof matchMedia === 'function' ? matchMedia('(prefers-color-scheme: dark)') : null;
    if (mq) {
      this.systemDark.set(mq.matches);
      const onChange = (e: MediaQueryListEvent) => this.systemDark.set(e.matches);
      mq.addEventListener('change', onChange);
      inject(DestroyRef).onDestroy(() => mq.removeEventListener('change', onChange));
    }
    const root = this.doc.documentElement;
    effect(() => {
      const a = this.appearance();
      const scheme = resolveScheme(a.scheme, this.systemDark());
      for (const [name, value] of Object.entries(tokensFor(a, scheme))) {
        root.style.setProperty(`--${name}`, value);
      }
      root.style.colorScheme = scheme;
      root.dataset['scheme'] = scheme;
      this.version.update((v) => v + 1);
    });
  }
}
