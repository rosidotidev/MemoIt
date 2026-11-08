---
name: MemoIt
status: final
updated: 2026-11-06
sources:
  - _bmad-output/planning-artifacts/prds/prd-bmad612_home-2026-11-06/prd.md
  - _bmad-output/planning-artifacts/briefs/brief-bmad612_home-2026-11-06/brief.md
---

# MemoIt — Experience Spine

> Paired with `DESIGN.md`. Token references use `{path.to.token}`. Where a mockup in `mockups/` and this spine disagree, this spine wins. `[ASSUMPTION]` marks decisions taken in fast path that the owner has not yet confirmed.

## Foundation

Responsive web app (Angular), designed mobile-first and optionally installable as a PWA (Could). Material 3 is the UI system: components, motion and navigation patterns follow M3, and this spine only specifies what differs. Visual identity lives in `DESIGN.md`. Languages: English (default) and Italian. Light, dark and system appearance. One user-chosen accent colour re-themes the whole app (FR-14).

## Information Architecture

| Surface | Reached from | Purpose |
|---|---|---|
| Login | App open without a session; Sign out | Authenticate |
| Categories | Login; navigation | Home. Pick a category or create one |
| Items | Category tap | Read and tick off the items of one category |
| Item edit | Add item FAB; edit icon on a row | Create, change or delete one item |
| Category settings | ⋮ menu in Items | Rename, Done label, Reportable, clear done, delete category |
| Report | Navigation | Value trend for Reportable categories |
| Settings | Navigation; palette icon in Categories; account menu | Accent, appearance, language, account |

Primary navigation has three destinations: **Categories**, **Report**, **Settings**. It adapts to the window class and never changes the set of destinations:

| Window class | Component |
|---|---|
| Compact < 768px | Bottom navigation bar |
| Medium 768–1199px | Navigation rail |
| Expanded ≥ 1200px | Navigation drawer (rail with labels and logo) |

Item edit, Category settings and Login are not primary destinations: they hide the bottom bar's active state on Login (no bar at all) and keep **Categories** active on the others.

From 1024px, Items is two-pane: the category list on the left (current category selected), items on the right. The back arrow is hidden in that layout.

→ Full path-by-path map: `NAVIGATION.md`. Composition references: `mockups/*.html`. Spine wins on conflict.

## Voice and Tone

Short, plain, no exclamation marks, no emoji. Confirmations name the thing.

| Do | Don't |
|---|---|
| “Oat milk marked done” | “Great job! Task completed!” |
| “Delete this item?” + “This can't be undone.” | “Are you sure??” |
| “Nothing here yet” + one line saying what to do | “Oops, no data” |
| The category's own Done label: “Bought”, “Read” | A fixed “Completed” everywhere |

## Component Patterns

| Component | Use | Behavioral rules |
|---|---|---|
| Category row | Categories, Items left pane | Whole row taps through to Items. Shows open count as a badge; none when zero. |
| Item row | Items | Tap anywhere on the row toggles Done (FR-6). Only the edit icon opens Item edit. Open items first, Done below, struck through. |
| FAB | Categories (New category), Items (Add item) | One per screen. Extended with a label. Hidden on empty Categories because the empty state carries the action. |
| Sort sheet | Items | Options: Newest first (default), Priority, Deadline. Applies to open items only. Selection closes the sheet. `[ASSUMPTION]` the choice is not remembered across visits. |
| Confirm dialog | Delete item, clear done, delete category | Names what will be lost and how many. Destructive button is text style in `{colors.error}`. Escape or Cancel dismisses. Never used for undoable actions. |
| Summary card | Categories (top) | Counts for the whole account: overdue (headline), open, due this week, categories. All derived from the loaded Items; not tappable. |
| Due soon strip | Categories | Horizontal cards for open Items with a Deadline, soonest first, overdue first. Each card opens its Category. Hidden when there are none. |
| Search and filter chips | Categories (search by Category name), Items (search in the Category, chips All, Overdue, High priority, Has deadline) | Filter as you type, in memory. Exactly one chip is active; the Done section is filtered too. Choices are per device and never saved to the account. |
| Item preview | Item edit | A live copy of the Item row, updated as the User types. No separate save. |
| Report summary and period chips | Report | Summary of latest Value, change over the period, average and lowest; chips 3 months, 6 months, 1 year, All; weekly or monthly switch. A link opens the Category's Item list. |
| Deadline alert | Any screen while the app is open `[ASSUMPTION]` | When an open Item's Deadline arrives, a banner at the top says what is due; tapping it opens the Item. One per Item and Deadline. Dismisses itself after 8 seconds. |
| Snackbar | After toggle Done, after save | 5 seconds, one line, optional Undo. Announced politely. Does not stack: a new one replaces the old. |
| Account menu | Top app bar of every screen except Login | Avatar button opens a menu: name and email, Settings, **Sign out**. Closes on outside tap, Escape, or resize; Escape returns focus to the avatar. Sign out never asks for confirmation (it is reversible) and lands on Login with a snackbar “You have been signed out”. On medium and expanded windows, Sign out is also the last entry of the rail or drawer. |
| Accent picker | Settings | Radio group of swatches plus a hue slider. Applies live; no Save button. |

## State Patterns

| State | Where | Behaviour |
|---|---|---|
| Empty categories | Categories, new user (UJ-5) | Centered icon, “Nothing here yet”, one line, filled button “New category”. |
| Empty category | Items | `[ASSUMPTION]` same pattern with “Add item”. Not mocked. |
| Overdue | Item row | Deadline chip turns `{components.chip-overdue}`. Text says “Overdue”, never colour alone. |
| Done | Item row | Filled check, title struck through, row moves to the Done section. |
| No Reportable category | Report | Empty state explaining how to enable it. |
| Offline | Everywhere | Not supported in v1 (PRD §6.3). A write that cannot complete shows the `network` or `timeout` error inline; nothing is queued. |
| Loading | Lists | `[ASSUMPTION]` skeleton rows at 72px. Not mocked. |
| Error saving | Forms | Inline support text under the field, never a dialog. |

## Interaction Primitives

- **Tap** is the primary gesture. Marking Done is a single tap with Undo, never a confirmation.
- **No swipe-to-delete** in v1: deleting happens in Item edit with a confirmation, to avoid accidents on a one-handed list.
- Targets are at least 48×48 CSS px; list rows are 72px tall.
- Keyboard: Tab order follows visual order; Enter and Space activate rows and buttons; Escape closes dialogs and sheets.
- Motion: M3 standard easing, 150–250ms. With reduced motion, transitions drop to near zero.
- Theme changes apply instantly and persist per user; no reload.

## Accessibility Floor

- Contrast: text 4.5:1, large text and icons 3:1, in both schemes and for every accent. The tonal mapping is designed to keep this, but each preset must be verified. Measured on 2026-11-06: every preset and sampled hue passes in both schemes (see `DESIGN.md`).
- Never rely on colour alone: Overdue and High have text labels; selected states also change shape or weight.
- Screen reader: rows expose a toggle state (`aria-pressed`), chips are read as text, snackbars use a polite live region, dialogs trap focus and restore it on close.
- Focus is always visible (3px `{colors.primary}` outline).
- Text resizes to 200% without loss; layouts reflow, nothing is clipped.

## Key Flows

### Giulia ticks off the shopping list
Giulia is in the supermarket, phone in one hand, cart in the other.
1. She opens MemoIt; she is already signed in, so Categories appears.
2. One tap on **Grocery list** shows the open items first.
3. She taps **Oat milk**. It is struck through and drops to the Done section. A snackbar says “Oat milk marked done” with Undo.
4. She taps **Tomatoes**, and then taps **Parmesan** by mistake.
5. **Climax:** she presses **Undo** in the snackbar and Parmesan returns to the open list, with no dialog to read and nothing lost.

### Bob captures a book idea on the train
1. From Categories he taps **Books to buy**, then the **Add item** FAB.
2. In Item edit he types the title only, sets High priority, and taps **Save**.
3. **Climax:** he lands back on the list, the new book at the top, in under ten seconds.

### Bob makes the app his own
1. From any screen he opens **Settings**.
2. He picks **Teal** in Accent; the page recolours as he taps.
3. He drags the hue slider a little toward green and switches Appearance to **Dark**.
4. **Climax:** he opens Categories and every screen already wears his colour, and it will still be there tomorrow.

### A family member's first login
Giulia signs in with an account Bob created. **Categories** is empty (UJ-5), shows the empty state, and she creates her first category from its button. Her data is invisible to Bob and the other way round.

## Responsive & Platform

| Aspect | Compact < 768 | Medium 768–1199 | Expanded ≥ 1200 |
|---|---|---|---|
| Navigation | Bottom bar | Rail | Drawer with labels |
| Content width | Full, 16px margins | Centered, max 720 (1040 for Report, Settings) | Same, beside the drawer |
| Items | Single column, back arrow | Single column | ≥ 1024px: category list on the left, items on the right |
| FAB | Above the bottom bar, right | Bottom right | Bottom right |
| Dialogs | Centered; Sort is a bottom sheet | Centered; Sort is a centered sheet | Same |
| Settings | Single column of cards | Cards in 2 columns | Cards in 2 columns |

PWA: optional (PRD 4.7, Could). Reminders are in-app only, so installation is not required.

## Open Items

- `[ASSUMPTION]` Mood and visual direction were not specified; the Material 3 default look with a single accent was used. Confirm or redirect.
- `[ASSUMPTION]` Nine accent presets plus a free hue slider.
- `[ASSUMPTION]` No per-category colour in v1.
- Decided on 2026-11-06: offline and push are out of v1, and there is no reminder lead time (PRD §6.3, FR-9). The mockups carry no Notifications switch, "Remind me" setting, "Keep me signed in", moving an Item between Categories, Report bar chart or "Done today" counter.
- Not mocked, spine-only: empty category, loading and error states, the Deadline alert.
