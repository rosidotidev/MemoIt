import type { Appearance } from '../domain/preferences';

/** Nine accent presets (OKLCH hue and chroma). `custom` takes its own hue and chroma. */
export const ACCENT_PRESETS: readonly { readonly id: string; readonly hue: number; readonly chroma: number }[] = [
  { id: 'indigo', hue: 277, chroma: 0.13 },
  { id: 'blue', hue: 250, chroma: 0.13 },
  { id: 'teal', hue: 195, chroma: 0.11 },
  { id: 'green', hue: 150, chroma: 0.13 },
  { id: 'amber', hue: 85, chroma: 0.13 },
  { id: 'orange', hue: 55, chroma: 0.14 },
  { id: 'rose', hue: 10, chroma: 0.14 },
  { id: 'magenta', hue: 335, chroma: 0.14 },
  { id: 'purple', hue: 305, chroma: 0.13 },
];

export const HUE_MAX = 360;
export const CHROMA_MAX = 0.3;

export type ResolvedScheme = 'light' | 'dark';
/** CSS custom property name (without the leading dashes) to a hex color. */
export type TokenMap = Readonly<Record<string, string>>;

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

/** Hue and chroma of an accent; unknown ids fall back to indigo, custom values are clamped. */
export function accentOf(a: Pick<Appearance, 'accent' | 'hue' | 'chroma'>): { hue: number; chroma: number } {
  if (a.accent === 'custom' && Number.isFinite(a.hue) && Number.isFinite(a.chroma)) {
    return { hue: clamp(a.hue as number, 0, HUE_MAX), chroma: clamp(a.chroma as number, 0, CHROMA_MAX) };
  }
  const p = ACCENT_PRESETS.find((x) => x.id === a.accent) ?? ACCENT_PRESETS[0];
  return { hue: p.hue, chroma: p.chroma };
}

function oklchToLinear(L: number, c: number, hDeg: number): [number, number, number] {
  const h = (hDeg * Math.PI) / 180;
  const a = c * Math.cos(h);
  const b = c * Math.sin(h);
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

const inGamut = (rgb: number[]) => rgb.every((v) => v >= -0.0005 && v <= 1.0005);

/** Tonal color: lightness is the tone (0 to 100); chroma is reduced until the color fits sRGB. */
export function tone(hue: number, chroma: number, t: number): string {
  const L = clamp(t, 0, 100) / 100;
  let lo = 0;
  let hi = chroma;
  let rgb = oklchToLinear(L, hi, hue);
  if (!inGamut(rgb)) {
    for (let i = 0; i < 20; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(oklchToLinear(L, mid, hue))) {
        lo = mid;
      } else {
        hi = mid;
      }
    }
    rgb = oklchToLinear(L, lo, hue);
  }
  const enc = (v: number) => {
    const x = clamp(v, 0, 1);
    const g = x <= 0.0031308 ? 12.92 * x : 1.055 * x ** (1 / 2.4) - 0.055;
    return Math.round(g * 255)
      .toString(16)
      .padStart(2, '0');
  };
  return `#${rgb.map(enc).join('')}`;
}

/** Fixed hues: error, overdue and High colors never follow the accent. */
const ERROR_HUE = 25;
const TERTIARY_HUE = 350;

const TONES = {
  light: { pri: 40, onPri: 100, cont: 90, onCont: 10, surf: 98, low: 100, mid: 94, high: 92, onSurf: 10, onVar: 30, out: 50, outVar: 80, inv: 20, onInv: 95 },
  dark: { pri: 80, onPri: 20, cont: 30, onCont: 90, surf: 6, low: 4, mid: 12, high: 17, onSurf: 90, onVar: 80, out: 60, outVar: 30, inv: 90, onInv: 20 },
} as const;

/** Maps an accent and a resolved scheme to every role token used by the app. */
export function tokensFor(a: Pick<Appearance, 'accent' | 'hue' | 'chroma'>, scheme: ResolvedScheme): TokenMap {
  const { hue, chroma } = accentOf(a);
  const dark = scheme === 'dark';
  const p = (t: number, k = 1) => tone(hue, chroma * k, t);
  const e = (t: number) => tone(ERROR_HUE, 0.2, t);
  const y = (t: number) => tone(TERTIARY_HUE, 0.08, t);
  const T = TONES[scheme];
  return {
    primary: p(T.pri),
    'on-primary': p(T.onPri, 0.1),
    'primary-container': p(T.cont),
    'on-primary-container': p(T.onCont),
    'secondary-container': p(T.cont, 0.4),
    'on-secondary-container': p(T.onCont, 0.4),
    surface: p(T.surf, 0.08),
    'surface-container-lowest': p(T.low, 0.04),
    'surface-container': p(T.mid, 0.1),
    'surface-container-high': p(T.high, 0.12),
    'on-surface': p(T.onSurf, 0.04),
    'on-surface-variant': p(T.onVar, 0.15),
    outline: p(T.out, 0.15),
    'outline-variant': p(T.outVar, 0.15),
    'inverse-surface': p(T.inv, 0.06),
    'inverse-on-surface': p(T.onInv, 0.04),
    error: e(dark ? 80 : 40),
    'error-container': e(dark ? 30 : 90),
    'on-error-container': e(dark ? 90 : 10),
    'tertiary-container': y(dark ? 30 : 90),
    'on-tertiary-container': y(dark ? 90 : 10),
    scrim: '#00000066',
    shadow: '#00000033',
  };
}

/** Pairs checked by the contrast test: [foreground, background]. */
export const TEXT_PAIRS: readonly (readonly [string, string])[] = [
  ['on-primary', 'primary'],
  ['on-primary-container', 'primary-container'],
  ['on-secondary-container', 'secondary-container'],
  ['on-surface', 'surface'],
  ['on-surface', 'surface-container'],
  ['on-surface', 'surface-container-high'],
  ['on-surface', 'surface-container-lowest'],
  ['on-surface-variant', 'surface'],
  ['on-surface-variant', 'surface-container'],
  ['on-surface-variant', 'surface-container-high'],
  ['primary', 'surface'],
  ['primary', 'surface-container'],
  ['error', 'surface'],
  ['error', 'surface-container'],
  ['on-surface-variant', 'secondary-container'],
  ['on-surface', 'primary-container'],
  ['on-error-container', 'error-container'],
  ['on-tertiary-container', 'tertiary-container'],
  ['inverse-on-surface', 'inverse-surface'],
];
export const GRAPHIC_PAIRS: readonly (readonly [string, string])[] = [
  ['outline', 'surface'],
  ['outline', 'surface-container'],
  ['outline', 'surface-container-high'],
  ['outline', 'secondary-container'],
  ['primary', 'surface'],
];

function luminance(hex: string): number {
  const ch = [1, 3, 5].map((i) => {
    const v = parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}

/** WCAG contrast ratio between two `#rrggbb` colors. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}

/** The resolved scheme for a choice; `system` follows the OS preference. */
export function resolveScheme(scheme: Appearance['scheme'], systemDark: boolean): ResolvedScheme {
  return scheme === 'system' ? (systemDark ? 'dark' : 'light') : scheme;
}
