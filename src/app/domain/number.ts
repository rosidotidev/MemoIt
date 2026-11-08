/** Numbers entered as a Value (AD-16, AD-15d). The only place that parses or formats numbers for display. */

export type NumberLanguage = 'it' | 'en';

/** Largest magnitude accepted (exclusive); the Firestore rules use the same bound. */
export const VALUE_LIMIT = 1e12;

const NUMBER_RE = /^[+-]?(\d+([.,]\d*)?|[.,]\d+)$/;

/**
 * Parses a decimal typed with a comma or a point, in either Language. No thousands separators.
 * Returns null for anything that is not a finite number below VALUE_LIMIT in magnitude (including empty text).
 */
export function parseNumber(text: string): number | null {
  const t = text.trim();
  if (!NUMBER_RE.test(t)) {
    return null;
  }
  const n = Number(t.replace(',', '.'));
  return Number.isFinite(n) && Math.abs(n) < VALUE_LIMIT ? n : null;
}

/** The one rounding rule: two decimals, half away from zero. */
export function roundValue(n: number): number {
  const cents = Math.round(Number((Math.abs(n) * 100).toPrecision(14)));
  return (n < 0 ? -cents : cents) / 100;
}

/** Display text: up to two decimals, no trailing zeros, comma for Italian and point for English. */
export function formatNumber(n: number, language: NumberLanguage): string {
  const cents = Math.round(Number((Math.abs(n) * 100).toPrecision(14)));
  const whole = Math.floor(cents / 100);
  const frac = cents % 100;
  const sign = n < 0 && cents !== 0 ? '-' : '';
  const sep = language === 'it' ? ',' : '.';
  const fracText = frac === 0 ? '' : sep + (frac < 10 ? `0${frac}` : `${frac}`).replace(/0$/, '');
  return `${sign}${whole}${fracText}`;
}

/** Text to put back in an input when editing a stored Value: point decimal, parseable in either Language. */
export function toInputText(n: number): string {
  return formatNumber(n, 'en');
}

/** Vectors shared by the unit tests and the Firestore rules tests. `value` null means rejected. */
export const PARSE_VECTORS: readonly { readonly text: string; readonly value: number | null }[] = [
  { text: '82.4', value: 82.4 },
  { text: '82,4', value: 82.4 },
  { text: ' 7 ', value: 7 },
  { text: '-3,5', value: -3.5 },
  { text: '0', value: 0 },
  { text: '.5', value: 0.5 },
  { text: '12.', value: 12 },
  { text: '', value: null },
  { text: 'abc', value: null },
  { text: '1,2,3', value: null },
  { text: '1.234,5', value: null },
  { text: '12kg', value: null },
  { text: 'NaN', value: null },
  { text: 'Infinity', value: null },
  { text: '1e5', value: null },
  { text: '1000000000000', value: null },
];
