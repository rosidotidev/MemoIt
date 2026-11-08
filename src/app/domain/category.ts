export interface Category {
  readonly id: string;
  readonly name: string;
  readonly stateLabel: string;
  readonly reportable: boolean;
}

export type CategoryData = Omit<Category, 'id'>;

export const DEFAULT_STATE_LABEL = 'Done';
export const NAME_MAX = 60;
export const STATE_LABEL_MAX = 16;
export const STATE_LABEL_SUGGESTIONS: readonly string[] = ['Done', 'Bought', 'Read', 'Watched', 'Completed'];

/** Error codes of a failed backend call. */
export type CategoryErrorCode = 'network' | 'timeout' | 'permission' | 'invalid' | 'notFound' | 'unknown';
export type NameError = 'empty' | 'duplicate' | 'invalid';
export type AddError = CategoryErrorCode | NameError;
export type StateLabelError = 'empty' | 'invalid';
export type UpdateError = CategoryErrorCode | NameError | 'labelEmpty' | 'labelInvalid';

export type AddResult =
  | { readonly ok: true; readonly category: Category }
  | { readonly ok: false; readonly error: AddError };

export type UpdateResult =
  | { readonly ok: true; readonly category: Category }
  | { readonly ok: false; readonly error: UpdateError };

export const normalizeName = (name: string): string => name.trim();

/** Checks a name against the rules and the loaded Categories (unique, case-insensitive). Null means valid. */
export function validateName(
  name: string,
  existing: readonly Category[],
  exceptId?: string,
): NameError | null {
  const n = normalizeName(name);
  if (n === '') {
    return 'empty';
  }
  if ([...n].length > NAME_MAX) {
    return 'invalid';
  }
  const fold = (s: string) => normalizeName(s).normalize('NFC').toLowerCase();
  const key = fold(n);
  return existing.some((c) => c.id !== exceptId && fold(c.name) === key) ? 'duplicate' : null;
}

/** Checks a State Label (trimmed, 1 to 16 characters). Null means valid. */
export function validateStateLabel(label: string): StateLabelError | null {
  const n = label.trim();
  if (n === '') {
    return 'empty';
  }
  return [...n].length > STATE_LABEL_MAX ? 'invalid' : null;
}

/** Share of done Items, 0 to 1. Zero when there are no Items. */
export function progress(done: number, total: number): number {
  if (total <= 0) {
    return 0;
  }
  return Math.min(1, Math.max(0, done / total));
}
