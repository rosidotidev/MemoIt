export type Language = 'en' | 'it';
export type Scheme = 'light' | 'dark' | 'system';

/** The whole `users/{uid}/preferences/app` document. */
export interface Preferences {
  readonly accent: string;
  readonly hue?: number;
  readonly chroma?: number;
  readonly scheme: Scheme;
  readonly language: Language;
}

/** The part of Preferences that drives the theme. */
export type Appearance = Pick<Preferences, 'accent' | 'hue' | 'chroma' | 'scheme'>;

export const DEFAULT_PREFERENCES: Preferences = { accent: 'indigo', scheme: 'system', language: 'en' };

export function isLanguage(v: unknown): v is Language {
  return v === 'it' || v === 'en';
}
