import { DOCUMENT } from '@angular/common';
import { Injectable, computed, effect, inject, signal } from '@angular/core';
import { STRINGS, type Language } from './strings';

/** Language mirrored to localStorage by PreferencesStore, so the first paint has no flash. */
function readMirror(): Language {
  try {
    const v = localStorage.getItem('memoit.language');
    return v === 'it' || v === 'en' ? v : 'en';
  } catch {
    return 'en';
  }
}

@Injectable({ providedIn: 'root' })
export class LanguageService {
  private readonly doc = inject(DOCUMENT);
  readonly language = signal<Language>(readMirror());
  readonly strings = computed(() => STRINGS[this.language()]);

  constructor() {
    effect(() => {
      this.doc.documentElement.lang = this.language();
    });
  }
}
