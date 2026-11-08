import type { ItemFieldError } from './item';
import { parseNumber } from './number';

export const TITLE_MAX = 120;
export const DESCRIPTION_MAX = 4000;

export const normalizeTitle = (title: string): string => title.trim();

/** Title is trimmed and must be 1 to 120 code points. Null means valid. */
export function validateTitle(title: string): Extract<ItemFieldError, 'empty' | 'titleTooLong'> | null {
  const n = normalizeTitle(title);
  if (n === '') {
    return 'empty';
  }
  return [...n].length > TITLE_MAX ? 'titleTooLong' : null;
}

/** Description is optional, at most 4000 code points. Null means valid. */
export function validateDescription(description: string): Extract<ItemFieldError, 'descriptionTooLong'> | null {
  return [...description.trim()].length > DESCRIPTION_MAX ? 'descriptionTooLong' : null;
}

/** Value text: empty is fine (no Value), otherwise it must parse as a number. Null means valid. */
export function validateValue(text: string): Extract<ItemFieldError, 'valueInvalid'> | null {
  return text.trim() === '' || parseNumber(text) !== null ? null : 'valueInvalid';
}

/** The number to store for Value text: a number, or null for none. Call only after validateValue passed. */
export function valueFromText(text: string): number | null {
  return parseNumber(text);
}
