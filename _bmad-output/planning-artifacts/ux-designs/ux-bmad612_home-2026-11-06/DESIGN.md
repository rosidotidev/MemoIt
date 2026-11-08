---
name: MemoIt
description: Quiet, mobile-first notes and lists app on Material 3. One user-chosen accent recolours everything.
status: final
updated: 2026-11-06
sources:
  - _bmad-output/planning-artifacts/prds/prd-bmad612_home-2026-11-06/prd.md
colors:
  # Default accent = Indigo (hue 275). Every role below is derived from the accent; see "Colors".
  primary: '#474FB6'
  on-primary: '#FAFBFF'
  primary-container: '#D6E2FF'
  on-primary-container: '#1A0772'
  secondary-container: '#DFE5FE'
  on-secondary-container: '#252A4E'
  tertiary: '#874B7B'
  tertiary-container: '#FDD7F4'
  surface: '#F9FAFD'
  surface-container: '#EEF0F6'
  surface-container-high: '#E9EBF1'
  on-surface: '#191A20'
  on-surface-variant: '#52555E'
  outline: '#7D808A'
  outline-variant: '#CED0D9'
  error: '#BE241F'
  error-container: '#FFD9D2'
  primary-dark: '#A6B7FF'
  on-primary-dark: '#1F157B'
  primary-container-dark: '#313785'
  on-primary-container-dark: '#DBE3FF'
  secondary-container-dark: '#373C52'
  on-secondary-container-dark: '#E0E4F5'
  tertiary-dark: '#E2A9D4'
  tertiary-container-dark: '#542E4C'
  surface-dark: '#101116'
  surface-container-dark: '#1A1B21'
  surface-container-high-dark: '#212229'
  on-surface-dark: '#E4E6EC'
  on-surface-variant-dark: '#B4B7C1'
  outline-dark: '#7D8089'
  outline-variant-dark: '#3B3D44'
  error-dark: '#FF9688'
  error-container-dark: '#75201A'
typography:
  display:
    fontFamily: Roboto Flex
    fontSize: 36px
    fontWeight: 400
    lineHeight: 44px
  headline:
    fontFamily: Roboto Flex
    fontSize: 28px
    fontWeight: 400
    lineHeight: 36px
  title-lg:
    fontFamily: Roboto Flex
    fontSize: 22px
    fontWeight: 400
    lineHeight: 28px
  title-md:
    fontFamily: Roboto Flex
    fontSize: 16px
    fontWeight: 500
    lineHeight: 24px
  body-md:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: 400
    lineHeight: 20px
  label-lg:
    fontFamily: Roboto Flex
    fontSize: 14px
    fontWeight: 500
    lineHeight: 20px
  label-md:
    fontFamily: Roboto Flex
    fontSize: 12px
    fontWeight: 500
    lineHeight: 16px
rounded:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 28px
  full: 999px
spacing:
  '1': 4px
  '2': 8px
  '3': 12px
  '4': 16px
  '5': 24px
  '6': 32px
  '7': 48px
components:
  button-filled:
    backgroundColor: '{colors.primary}'
    textColor: '{colors.on-primary}'
    typography: '{typography.label-lg}'
    rounded: '{rounded.full}'
    height: 40px
    padding: 0 24px
  button-tonal:
    backgroundColor: '{colors.secondary-container}'
    textColor: '{colors.on-secondary-container}'
    rounded: '{rounded.full}'
    height: 40px
  fab:
    backgroundColor: '{colors.primary-container}'
    textColor: '{colors.on-primary-container}'
    rounded: '{rounded.lg}'
    height: 56px
  list-row:
    backgroundColor: transparent
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    height: 72px
    padding: 12px 16px
  card:
    backgroundColor: '{colors.surface-container}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.lg}'
    padding: 16px
  text-field:
    backgroundColor: transparent
    textColor: '{colors.on-surface}'
    rounded: '{rounded.xs}'
    height: 56px
  chip-overdue:
    backgroundColor: '{colors.error-container}'
    textColor: '{colors.error}'
    rounded: '{rounded.sm}'
    height: 28px
  nav-bar:
    backgroundColor: '{colors.surface-container}'
    textColor: '{colors.on-surface-variant}'
    height: 80px
  dialog:
    backgroundColor: '{colors.surface-container-high}'
    textColor: '{colors.on-surface}'
    rounded: '{rounded.xl}'
    padding: 24px
---

## Brand & Style

MemoIt is a quiet place to capture and tick things off. The product is the list, so the interface stays out of the way: Material 3 as written, no custom ornament, no illustration beyond the empty states. Beauty comes from tone, space and type, never from decoration.

The one expressive element is colour, and it belongs to the user. They pick an accent and the whole app takes that colour's character: surfaces, buttons, check marks, charts. Two people sharing a phone family can each have an app that feels like theirs.

## Colors

Colours follow the Material 3 role system (primary, secondary, tertiary, surface containers, outline, error), light and dark. **Every role derives from a single accent**, defined as a hue and a chroma, using tonal mapping in OKLCH: primary sits at tone 48 (light) or 80 (dark), containers at 92 or 38, surfaces are the same hue at near-zero chroma. Changing the accent changes all roles at once and keeps contrast intact by construction.

- **Primary** is for the one action that matters on a screen and for “checked” state.
- **Primary container** is for the FAB and avatar tiles.
- **Secondary container** marks selection: active navigation destination, selected segment, count badges.
- **Tertiary** is the accent's hue rotated by +60°. It is used only for the *High* priority chip, so priority is distinguishable without red.
- **Error** is reserved for *Overdue* and destructive actions. It never depends on the accent.
- The hex values in the frontmatter are the default accent, **Indigo (hue 275)**. They are a reference snapshot; the runtime formula is in `mockups/assets/m3.css`.

Accent presets: Indigo, Blue, Teal, Green, Amber, Orange, Rose, Purple, Graphite (near-neutral), plus a free hue slider. `[ASSUMPTION]` This set of nine is a starting point; the owner can change it.

**Contrast, measured on 2026-11-06.** 756 role pairs (14 text and graphic pairs, for each of the nine presets and eighteen sampled hues at chroma 0.16, in light and dark) all meet WCAG AA: 4.5:1 for text, 3:1 for borders and graphics. The tightest margin is 1.25 times the minimum: primary text on `surface-container-low` in the green hues (5.6:1) and `outline` on `surface` in the teal and green hues (3.8:1). The measurement used an approximate gamut mapping; the build-time test in the architecture (AD-12) is the standing gate.

Avoid: gradients on content surfaces (the one exception is the soft accent wash behind the login card), more than one accent at a time, per-category colours (out of scope for v1).

## Typography

Material 3 type scale in Roboto Flex, falling back to Roboto then the system font. Display for screen titles on large heads, title for rows and sections, body for descriptions, label for buttons, chips and nav. No all-caps except the tiny preview label. Text scales with the system font size setting; nothing may be truncated at 200%.

## Layout & Spacing

4-pt grid: 4 / 8 / 12 / 16 / 24 / 32 / 48. Mobile margins are 16px. Content never exceeds 720px (lists) or 1040px (Report, Settings) so line lengths stay readable on desktop.

Three window classes drive structure: compact (< 768px, bottom navigation bar), medium (768–1199px, navigation rail), expanded (≥ 1200px, navigation drawer). From 1024px, Items shows the category list beside the items. Layout rules are in `EXPERIENCE.md`.

## Elevation & Depth

Hierarchy comes from tone, not shadow. Cards are tonal fills (`surface-container`); outlined cards use `outline-variant`. Only the FAB, dialogs, sheets and snackbars cast a shadow, and they sit on a scrim where they interrupt.

## Shapes

M3 shape scale: 4 (text fields), 8 (chips), 12, 16 (cards, FAB, list rows), 28 (dialogs and sheets), full (buttons, nav pills, switches). Avatar tiles are rounded squares at 16, not circles, so they read as categories and not people.

## Components

Standard Material 3 components, themed through tokens above. Visual deltas only:

- **List row**: 72px minimum, 16px radius, hover and press as a tonal overlay of `on-surface` at 6% and 10%.
- **Item row**: a 24px round check on the left; checked fills with `primary` and strikes the title through in `on-surface-variant`. The whole row is the tap target.
- **Chips**: 28px, 8px radius. *Overdue* uses `error-container`; *High* uses `tertiary-container`; the deadline chip is outlined.
- **Navigation**: bottom bar 80px with a 64×32 `secondary-container` pill behind the active icon; same pill on the rail; full-width pill on the drawer.
- **Text field**: outlined, 56px, floating label notched into the border; focus is a 2px `primary` border.
- **Segmented button**: used for Priority, aggregation, appearance and language; selected segment fills with `secondary-container`.
- **Accent swatch**: 48px circle with a check; the selected one scales up and gets a 3px `primary` ring.

## Do's and Don'ts

- Do derive any new colour from the accent roles; never hard-code a hue in a component.
- Do keep the primary action single per screen: one filled button or one FAB.
- Do check contrast in dark mode when adding a role; both schemes must meet 4.5:1 for text and 3:1 for icons and borders.
- Don't use the accent hue for error or success states.
- Don't add shadows to indicate hierarchy.
- Don't colour categories individually (v1).
- Don't add more than one font family.
