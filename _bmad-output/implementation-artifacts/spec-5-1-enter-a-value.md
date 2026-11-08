---
title: '5-1 Enter a Value'
type: 'feature'
created: '2026-11-07'
status: 'in-review'
route: 'oneshot'
review_loop_iteration: 0
context: ['{project-root}/_bmad-output/implementation-artifacts/epic-4-retro-2026-11-07.md']
---

Intent: an Item of a Reportable Category carries an optional numeric Value, entered in the Item form (new and edit). Decimal comma or point, either Language; non-numeric text is rejected inline (`valueInvalid`). Absent Value is an absent field, never null or 0; an empty field on edit removes it. Non-Reportable Categories hide the panel and edits leave stored Values untouched. 5.2 (Report) is out of scope.

## Implementation Notes

- `domain/number.ts`: `parseNumber`, `roundValue` (2 decimals, half away from zero), `formatNumber(n, language)` (integer arithmetic, no `toFixed`), `toInputText`, `VALUE_LIMIT` 1e12, `PARSE_VECTORS` shared by the unit spec and the rules spec.
- `Item.value?`, `NewItemData.value?`, `ItemEditData.value?: number | null`, `ItemDraft.value: string`; `validateValue` in `domain/validation.ts`.
- Data: `toDoc`/`toUpdateDoc`/`fromDoc` and `ItemStore` carry `value` (a non-finite stored value is read as absent). `ItemExtras.value` is sent only when the Category is Reportable.
- UI: `memo-item-form` shows `#item-value` (`showValue`, `value`, `valueChange`); `ItemNewComponent`/`ItemEditComponent` read `reportable` from `CategoryStore`.
- Rules: `value is number` plus `-1e12 < value < 1e12` (rejects NaN and Infinity, closing the epic 3/4 gap). ESLint: `toFixed`, `toLocaleString`, `Intl.NumberFormat` banned outside `domain/number.ts`.
- Not done: Value is not shown on item rows (5.2 reads it for the Report); the rules shape checks for `deadline` and `priority` already existed.
