# DESIGN.md — CapiMax Mobile Design Language

> Persistent design contract. Read every session alongside CLAUDE.md.
> **North star:** the Stake app design system — light-first, photo-forward, big-number
> hierarchy, rounded cards, soft elevation, green accent, generous whitespace, calm premium
> motion. Applied to BOTH our light and dark (teal/green) palettes.
>
> **Golden rule:** every screen reads colors/spacing/type/motion from the design tokens and the
> shared component library below — never ad-hoc styles. If a screen needs something not in the
> library, add it to the library (and this file), don't one-off it.

---

## 0) Design DNA (what "premium" means here)

1. **Light-first, airy.** Near-white backgrounds, lots of breathing room, content never crammed.
2. **Photos are heroes.** Asset cards lead with the cover image; everything else supports it.
3. **Big-number hierarchy.** Money and returns are large and confident; labels are small and muted.
4. **Soft, rounded, elevated.** Large radii, gentle shadows (light mode) / subtle raised surface
   + hairline border (dark mode). Flat fills — depth from elevation, not gradients (except the one
   approved brand gradient for hero/CTA moments).
5. **Green = action & gain.** Accent, primary buttons, positive returns. Never decorative noise.
6. **Calm motion.** Things fade and rise gently, numbers count up, loaders shimmer. Nothing bounces
   aggressively or distracts.
7. **Trust cues.** Verification/insurance badges, clear status, honest empty states.

We replicate Stake's structure, spacing, hierarchy, and motion — NOT its proprietary
illustrations/artwork. No hand-drawn scribbles or copied marketing graphics.

---

## 1) Color tokens (both modes share names; values differ)

All colors come from `useTheme()`. The two palettes already exist in `src/theme/palettes.js`.
This file adds the Stake-light surfaces and the semantic usage rules.

**LIGHT (Stake-style, primary experience):**
```
bg            #F4F7F5   (near-white, faint green tint — page background)
surface       #FFFFFF   (cards)
surfaceAlt    #EEF3F0   (chips, inactive segments, skeleton base)
card          #FFFFFF
border        rgba(11,41,40,0.08)
borderStrong  rgba(11,41,40,0.14)
primary       #2ead6f
primaryDark   #1f8a54   (use for primary-colored TEXT/links on light bg — contrast)
text          #0b2928
textSecondary #5a7a72
textMuted     #93aaa3
onPrimary     #0b2928   (text on a green fill — both modes, rule #4)
positive      #1f9d5f   gain text
negative      #d64545   loss text
warning       #E08600 · error #d32f2f · info #1976D2
```

**DARK (navy base + green accent — your brand identity):**
```
bg #121c30 · surface #1a2942 · surfaceAlt #223457 · card #18243c
border rgba(255,255,255,0.10) · borderStrong rgba(255,255,255,0.18)
primary #2ead6f · primaryLight #54c98a · primaryDark #1f8a54
text #FFFFFF · textSecondary #9fb0c9 · textMuted #6b7a93 · onPrimary #0b2928
positive #3ddb86 · negative #ff6b6b · warning #FFA726 · error #f44336 · info #2196F3
```
Green is the only saturated color in dark mode — reserve it for actions and gains; all neutral
surfaces stay navy, so the accent keeps its punch.

**Brand gradient (sparingly — hero balance card / onboarding CTA only):** `[#2ead6f → #1f8a54]`.
**Rule #4 (hard):** text on a `#2ead6f` fill is ALWAYS `onPrimary` (#0b2928), never white.

---

## 2) Spacing & layout

- **Base unit 4.** Scale: 4, 8, 12, 16, 20, 24, 32, 40.
- **Screen horizontal padding:** 20.
- **Gap between cards in a list:** 14.
- **Section vertical gap:** 28–32 (generous — this is the Stake "air").
- **Inside-card padding:** 16 (body), image is full-bleed to card edges.
- **Min tap target:** 44×44.
- One-column primary layout on phones; 2-up only for small stat tiles.

## 3) Radii & elevation

- **Radius:** card 20 · image (within card, top) inherits card top corners · inner image block 18
  · button 14 · chip/pill 999 · input 14 · sheet/modal top 28 · small badge 8.
- **Elevation light mode (soft shadow):**
  - card: `shadowColor:#0b2928, opacity:0.06, radius:18, offset:{0,8}` (Android `elevation:3`).
  - raised/pressable emphasis: opacity 0.10, radius 24.
- **Elevation dark mode:** NO shadow (won't read). Use a lighter surface (`surface`/`card` above
  `bg`) + `0.5px` `border`. Optionally a 1px top inset highlight `rgba(255,255,255,0.04)`.
- Borders are hairline `0.5px` everywhere they appear.

## 4) Typography

Use the platform system font (San Francisco / Roboto) via RN default, OR ship one clean geometric
sans (e.g. `Inter` via expo-font) — pick one and use it everywhere. Two weights mainly: 400 + 600.

| Token | Size / Weight / Line | Use |
|---|---|---|
| display | 34 / 700 / 40 | hero balance, big money on detail |
| h1 | 26 / 600 / 32 | screen titles |
| h2 | 20 / 600 / 26 | section titles, card titles |
| statNumber | 22 / 600 / 28 | price/share, available, stat tiles |
| body | 15 / 400 / 22 | default text |
| label | 13 / 500 / 18 | field labels, segment labels |
| caption | 12 / 400 / 16 | meta, muted secondary |
| micro | 11 / 600 / 14 | badge/pill text, uppercase tags (use sparingly, sentence case) |

- Money: format with thousands separators (`Intl.NumberFormat`), and remember `price_per_share`
  is a STRING from the API → `parseFloat` before formatting.
- Numbers are the loudest thing on screen; labels above them are small + `textSecondary`.

## 5) Iconography

- Single set: `@expo/vector-icons` → **Ionicons or Tabler-equivalent, OUTLINE only**, consistent
  stroke. No mixing sets. Inline 16–20, nav 24.
- Icons inherit text color; pair every icon with a clear purpose (no decorative clutter).

## 6) Imagery (asset cover images)

- Source: `cover_image_url`; gallery from `images[]` (respect `is_primary`/`order`).
- Aspect ratio in card: **16:10**, full-bleed to the card's left/right/top, `resizeMode:cover`.
- **Legibility overlay:** when text/badges sit on the image, add a bottom-up scrim
  `rgba(0,0,0,0→0.35)`. Badges (type chip top-left, return pill top-right) sit on the image.
- **Loading:** shimmer skeleton block at the image ratio; fade the image in on load (200ms).
- **Fallback:** if no image, a `surfaceAlt` block with a centered outline building icon (no broken
  image). Never show a raw broken-image state.

## 7) Core components (build these in `src/components/` and reuse everywhere)

Each must support light/dark via `useTheme()` and RTL. Specs:

- **AppButton** — variants: `primary` (green fill, onPrimary text, radius 14, height 52),
  `secondary` (transparent, 1px primary border, primary-colored text), `ghost` (text only),
  `icon` (square 52). Press: scale 0.97 + opacity, 120ms (reanimated). Loading: inline spinner,
  disabled dims to 0.5.
- **Card** — surface, radius 20, the elevation rules in §3. `pressable` prop adds press-scale.
- **AssetCard** — the hero (see mockup): full-bleed 16:10 cover image with scrim, type chip
  (top-left), return pill (top-right, positive/negative color), then body: title (h2), location/
  meta row with pin icon, trust badges row (CIM verified / CIM rated / HCC insured — only when
  `.enabled`), divider, two stat columns (price/share, available shares), and a primary CTA row.
- **StatTile** — small card: label (caption, muted) on top, number (statNumber) below, optional
  delta pill. Grid 2-up, gap 12.
- **ReturnPill / DeltaPill** — pill; positive = primary/positive bg-tint + dark-green text,
  negative = negative tint + negative text. Always show sign.
- **Chip** — `surfaceAlt` bg, caption text, radius 999; `selected` state = primary tint bg +
  primaryDark text. Used for category/country filters and type tags.
- **SegmentedControl** — for tabs (e.g. wallet transactions/withdrawals, chart ranges 1M/3M/1Y):
  pill track `surfaceAlt`, active segment slides (reanimated shared transition) to `surface` with
  soft shadow.
- **Field** — label (label token) + input (height 52, radius 14, `surfaceAlt` or bordered),
  focus ring = 1.5px primary, error text negative. (Upgrade the existing Phase-2 Field to this.)
- **Banner** — info/success/warning/error tinted row with icon + text + optional retry.
- **Badge** — small (radius 8) trust/verification badge: tinted bg + icon + micro text.
- **Skeleton** — shimmer (animated gradient sweep via reanimated) at the shape of the content it
  replaces. Use skeletons for loading, NOT centered spinners (spinner only for button-inline).
- **EmptyState** — centered outline icon + short title + one line + optional action button.
- **SectionHeader** — h2 title + optional trailing "See all" ghost action.
- **BottomSheet / Modal** — radius-28 top, drag handle, backdrop fade, sheet slides up (reanimated).
- **TabBar** (already exists) — restyle: floating-ish, `surface` bg, soft top shadow (light) /
  hairline top border (dark), active tab = primary icon + label, inactive = textMuted.

## 8) Motion (react-native-reanimated — already installed; calm + premium)

- **Screen transitions:** native stack default + subtle; detail pages slide + fade.
- **List entrance:** items fade + rise (translateY 12→0), **staggered** ~40ms each, 280ms,
  easing `out-cubic`. Run once on mount, not on every scroll.
- **Card press:** scale 0.97 + slight opacity, spring back. 120ms.
- **Numbers:** big money/return values **count up** on first appear (~600ms, ease-out).
- **Skeleton shimmer:** continuous gentle sweep while loading.
- **SegmentedControl/tab:** active pill slides with a spring (not linear).
- **Pull-to-refresh:** themed (primary tint).
- **Pressables everywhere:** never instant flat taps — always a small scale/opacity response.
- Keep durations 120–600ms. No aggressive bounces, no spinning, no parallax. Calm = premium.
- Respect reduce-motion: if OS reduce-motion is on, drop entrance/count-up to simple fades.

## 9) Light/dark adaptation rules

- Shadows are a LIGHT-mode tool only; in dark, replace with surface elevation + hairline border.
- Image scrims stay (they sit on photos, mode-independent).
- StatusBar + nav bar follow the active mode (already wired via ThemeContext).
- Test every screen in both modes; the mental check: would every number/label still be readable
  if the background flipped?

## 10) RTL

- All rows/paddings use logical direction (start/end), so they mirror in Arabic.
- Return pills, deltas, icons with direction (chevrons, arrows) flip in RTL.
- Numbers stay LTR even in Arabic layout; currency symbol placement follows locale.
- Verify each component in ar + en.

## 11) Definition of Done (design layer, in addition to CLAUDE.md §10)

- [ ] Uses only design tokens + shared components (no ad-hoc colors/spacing).
- [ ] Photo-forward where data has images; big-number hierarchy applied.
- [ ] Soft elevation (light) / surface+border (dark) — correct per mode.
- [ ] Entrance + press + (where relevant) count-up motion present and calm.
- [ ] Skeletons for loading (not spinners), proper empty + error states.
- [ ] Looks intentional and premium in BOTH modes and BOTH languages.
