# SPEC — TileSpace visual refresh

**Spec version:** 1.0
**Written:** 2026-08-22 23:52 PT
**Executor:** one agentic Claude Code session, four phases, run start to finish.

---

## 0. What this is

TileSpace's information architecture and interactions are good and stay
exactly as they are. Its visual language is being replaced. The new language is
the one used in the Tenzing app: a neutral near-white shell, plain white cards
with one border and one soft shadow, and colour used only where it carries
meaning.

Three approved target files define the result. They are in `docs/targets/`:

| File | Shows |
|---|---|
| `TARGET_page.html` | The main screen: sidebar + tile grid. **This is the primary target.** |
| `TARGET_page_collapsed.html` | The same screen with the sidebar collapsed to a rail. |
| `TARGET_page_mobile.html` | Mobile: the sidebar as a slide-over drawer. |

`docs/targets/generate_targets.py` produced all three from one frame. Read it
when a value is ambiguous in the HTML — it is the source of truth for the
tokens.

**Targets are READ-ONLY.** Do not edit them. If the code cannot match a
target, stop and report rather than changing the target.

---

## 1. DECISIONS ALREADY MADE — do not ask, do not re-open

Every question below has been settled with Ashish. If you find yourself about
to stop and ask about one of these, don't — the answer is here. If you hit a
question that is genuinely *not* on this list, take the option that changes
the least and record it in the report.

1. **The overview modal is deleted.** `OverviewMode.tsx` and
   `OverviewPageCard.tsx` are removed. The sidebar replaces them entirely.
2. **The sidebar is collapsible** to a narrow rail of colour swatches. It never
   disappears completely on desktop.
3. **Sidebar rows are drag-reorderable.** Reuse the existing
   `pageStore.insertPage(pageId, targetPosition)`. Do not write new
   position logic and do not touch `PageService.computeInsertPositions`.
4. **Welcome-back is retired.** `useWelcomeBack` exists only to pop the
   overview open after five minutes idle. With a permanent sidebar there is
   nothing for it to do. Delete the hook, its barrel export, the
   `WELCOME_BACK` constant, and the idle-check block inside
   `pageStore.loadPages`. Leave `PAGE_PERSISTENCE` alone.
5. **Page dots are removed on desktop, kept on mobile** as a position
   indicator only (they stay clickable; nothing depends on them being the
   primary navigation any more).
6. **`PageTitleDisplay` is deleted.** The page title now lives in the content
   header on both desktop and mobile.
7. **Chip colours come from a new fixed 12-hue table**, not from the page
   palette. Reason: the muted palettes (Lavender, Sand Dune, Dusty Rose…) are
   monochrome, so on white cards every chip would look identical. See §4.
8. **No database change. No migration.** `tiles.accent_color` keeps being
   written on create exactly as now; it simply stops driving what you see.
   `color_index` (0–11) is the display input.
9. **Page palettes survive** and still matter: `palette.background` drives the
   faint page tint and the page's swatch colour. `PaletteSelector` stays.
10. **Grid capacity tiers are unchanged.** 16 / 20 / 30 at 4×4, 5×4, 6×5. Do
    not add a 25-tile tier. Out of scope.
11. **Mobile is functional parity only.** The drawer must work; its visual
    polish is explicitly deferred. Do not spend time refining mobile beyond
    matching `TARGET_page_mobile.html` roughly.
12. **No new dependencies.** No animation library, no drag-and-drop library,
    no headless UI kit, no Playwright. Tailwind, React, lucide-react and
    zustand are what you have. If you believe a dependency is unavoidable,
    stop and report instead of installing it.
13. **No branches.** Work on `main`. Commit at the end of every phase.
14. **Behaviour is frozen** apart from the deletions listed above. Every
    existing interaction — tile drag/swap/insert, shift-to-swap, link paste,
    document editor, palette change, keyboard arrows, swipe, tile panel —
    must work identically afterwards.

---

## 2. Starting state and environment

```bash
git rev-parse HEAD        # record this SHA in the report as the starting point
git status                # must be clean before you start; if not, stop and report
node -v
npm ci
```

Commands used as gates throughout:

```bash
npm run typecheck   # tsc --noEmit -p tsconfig.app.json
npm run lint        # eslint .
npm run test        # vitest run
npm run build       # vite build
```

All four must be green at the end of every phase. `npm run test:all` runs
build + tests together.

Project rules that still apply (from `CLAUDE.md`): no file over 300 lines,
target 150–200; components render only; all Supabase access stays in `src/api/`;
imports use the `@/` alias; new components get a barrel export.

---

## 3. Design tokens

Add these to `tailwind.config.js` under `theme.extend`. Every colour in the
new UI comes from here — after Phase 3 there must be no literal hex in
`src/components/` except inside the chip-colour table and the palette
definitions.

```js
colors: {
  surface: {
    page:   '#FAFAF8',   // app background
    card:   '#FFFFFF',   // tiles, controls
  },
  edge: {
    DEFAULT: '#E8E6E1',  // card border
    soft:    '#EFEDE8',  // sidebar divider, dashed empty cell
  },
  ink: {
    DEFAULT: '#1C1B19',  // titles
    2:       '#4B4A46',  // sidebar rows, secondary
    muted:   '#8C8A83',  // counts, stamps
    faint:   '#B4B2AB',  // disabled, dot rest
  },
},
boxShadow: {
  card:   '0 1px 2px rgba(28,27,25,.04), 0 1px 3px rgba(28,27,25,.05)',
  cardHi: '0 4px 14px rgba(28,27,25,.09)',
},
borderRadius: {
  tile: '11px',
},
```

Layout constants go in `src/lib/constants.ts` as a new `LAYOUT` block:

```ts
export const LAYOUT = {
  SIDEBAR_WIDTH_PX: 236,
  SIDEBAR_COLLAPSED_PX: 60,
  GUTTER_PX: 28,
  HEADER_HEIGHT_PX: 60,
  FOOTER_HEIGHT_PX: 52,
  GRID_GAP_PX: 12,
  SIDEBAR_COLLAPSED_KEY: 'tilespace_sidebar_collapsed',
} as const;
```

**Delete** `TILE_VISUALS` and `OVERVIEW_MODE` and `WELCOME_BACK` from
`constants.ts` in the phase that orphans them. `PAGE_TITLE_OVERLAY` goes with
`PageTitleDisplay`.

---

## 4. The chip colour table

New file `src/lib/chipColors.ts`:

```ts
/**
 * Display colours for tile chips.
 *
 * Indexed by the tile's existing color_index (0-11). Deliberately NOT the
 * page palette: several palettes are monochrome by design, which reads fine
 * as full-bleed coloured tiles but produces twelve identical chips once the
 * card is white. These twelve hues are spaced around the wheel and all
 * readable as ink on white.
 */
export const CHIP_COLORS = [
  '#2563EB', '#7C3AED', '#DB2777', '#E11D48',
  '#EA580C', '#D97706', '#CA8A04', '#16A34A',
  '#0D9488', '#0891B2', '#4F46E5', '#9333EA',
] as const;

/** Safe lookup: any integer, including out-of-range or negative, maps to a colour. */
export function chipColor(colorIndex: number): string {
  const n = CHIP_COLORS.length;
  return CHIP_COLORS[((colorIndex % n) + n) % n];
}

/** The chip's tinted background: the same hue at ~9% over white. */
export function chipTint(colorIndex: number): string {
  return `${chipColor(colorIndex)}16`;
}
```

`chipColor` / `chipTint` become the single source for tile colour anywhere a
tile is shown: the grid chip, `TileSubmenu`, the `TilePanel` header tint, the
`PasteLinkModal` tile dots, and — importantly — `PanelColorPicker`, whose
swatches must show the same twelve colours the user will actually get.

---

## 5. Phase 0 — foundation

**Scope**

1. Add the tokens of §3 to `tailwind.config.js`.
2. Add `LAYOUT` to `src/lib/constants.ts`.
3. Create `src/lib/chipColors.ts` per §4.
4. In `src/index.css`, remove the `.overview-card` block (its component dies in
   Phase 1) and the `::-webkit-scrollbar-thumb` dark values — replace the thumb
   with `rgba(28,27,25,0.14)` and hover `rgba(28,27,25,0.22)`. Leave the
   `.prose` block and the page-transition classes alone.

**Tests to add** — `src/test/chipColors.test.ts`:
- `chipColor(0)` … `chipColor(11)` return twelve distinct values.
- `chipColor(12) === chipColor(0)`; `chipColor(-1) === chipColor(11)`.
- `chipTint(n)` is `chipColor(n)` plus an 8-digit-hex alpha suffix.

**Acceptance**: four gates green. Nothing visually changed yet.

**Commit**: `refactor(design): add neutral tokens, layout constants, chip palette`

---

## 6. Phase 1 — the shell: sidebar replaces the overview

This is the phase with the real structural change. Match
`TARGET_page.html` and `TARGET_page_collapsed.html`.

### New components

`src/components/Sidebar/PageRow.tsx` (~90 lines)
- One page. Renders: drag grip (opacity 0, visible on row hover), an 11px
  rounded swatch in the page's `palette.background`, the title, the tile count.
- Active row: background is the page colour at 8% (`${bg}14`), text
  `ink`, weight 600.
- `onClick` → `goToPage`.
- Double-click on the title → inline rename, same behaviour the overview card
  had. Enter commits, Escape cancels, blur commits.
- Right-click → the context menu (Rename / Reset Page). Carry over the reset
  confirmation dialog verbatim from `OverviewMode.tsx`; restyle it to the new
  tokens but do not change its wording or its two-step flow.
- Draggable. `dragstart` must call `e.dataTransfer.setData('text/plain', id)` —
  Safari will not start a real drag without a payload, this is why the existing
  code does it.
- Collapsed variant: swatch only, centred, 15px, `title` attribute carries the
  page name.

`src/components/Sidebar/Sidebar.tsx` (~120 lines)
- Wordmark row at the top: 20px gradient glyph + "TileSpace".
- Scrolling list of `PageRow`, sorted by position.
- A quiet "New page" row at the foot of the list → `createPage`.
- Foot: `UserMenu` (moved here from its fixed position) and the collapse
  toggle.
- Drop handling: dropping row A onto row B calls
  `insertPage(A.id, B.position)`. That is exactly what the overview did; the
  vertical list has no other cases.
- Collapsed state read from and written to
  `localStorage[LAYOUT.SIDEBAR_COLLAPSED_KEY]`, defaulting to expanded.
  Wrap the read and the write in try/catch — private-mode browsers throw, and
  the existing `persistLastPage` sets the precedent.

`src/components/AppShell.tsx` (~70 lines)
- `flex` row: `Sidebar` then a `main` column of header / board / footer at the
  heights in `LAYOUT`.
- Header: page swatch, `h1` page title, nothing else on desktop.
- The page tint: on the shell's root element, a background of
  `radial-gradient(1200px 620px at 18% -12%, ${paletteBackground}12 0%, rgba(0,0,0,0) 62%), #FAFAF8`.
  This is the *only* place the page palette colours a surface.
- **Anchoring rule**: the header height, gutter and title size are constants,
  identical regardless of page or sidebar state. Switching pages must not move
  the title by a pixel.

### Deletions in this phase

- `src/components/OverviewMode.tsx`
- `src/components/OverviewPageCard.tsx`
- `src/components/PageTitleDisplay.tsx`
- `src/hooks/useWelcomeBack.ts`
- Their barrel exports in `components/index.ts` and `hooks/index.ts`.
- `uiStore`: `showOverview` and `setShowOverview`, and every call site
  (`App.tsx`, `FloatingActions`, `PageDots`).
- `constants.ts`: `WELCOME_BACK`, `OVERVIEW_MODE`, `PAGE_TITLE_OVERLAY`.
- The idle-check block at the end of `pageStore.loadPages`.
- The grain-texture `<svg>` overlay and the radial-gradient background in
  `App.tsx`.

Use `git rm` so the deletions are in the commit.

### App.tsx

`App.tsx` is currently 266 lines and must stay under 300. Wrapping its content
in `AppShell` and removing the overview wiring should reduce it. If it grows
past 300, extract the store-to-prop wiring for `TilePanel` into a small
`useTilePanelProps` hook rather than letting the file bloat.

### Mobile in this phase

`useIsMobile` already exists. On mobile:
- The sidebar renders as a fixed overlay drawer with a scrim, hidden by
  default, opened by tapping the page title in the header (which grows a small
  caret), closed by tapping the scrim, choosing a row, or pressing Escape.
- Swipe left/right between adjacent pages is untouched.
- `PageDots` stays mounted on mobile only. Delete its `isMobile` early-return
  and invert it: return `null` on **desktop**.

**Tests to add** — `src/test/Sidebar.test.tsx` (jsdom, @testing-library):
- Renders one row per page, in position order.
- Clicking a row calls the page-select handler with that page's id.
- Dropping page A on page B calls `insertPage` with `(A.id, B.position)`.
- The collapsed toggle writes `LAYOUT.SIDEBAR_COLLAPSED_KEY` and the collapsed
  render omits page titles.
- A `localStorage.setItem` that throws does not crash the component.

**Acceptance**: four gates green; no import of a deleted module anywhere
(`grep -rn "OverviewMode\|OverviewPageCard\|PageTitleDisplay\|useWelcomeBack\|showOverview" src/`
returns nothing).

**Commit**: `feat(ui): replace overview modal with collapsible page sidebar`

---

## 7. Phase 2 — the tiles

Match the grid in `TARGET_page.html`.

### TileCard.tsx — rewrite the presentation, keep every handler

The drag/drop props, the SWAP/INSERT badge logic, the click-to-open behaviour
and the grip all stay. What changes is everything visual:

- Card: `bg-surface-card border border-edge rounded-tile shadow-card`,
  hover `shadow-cardHi -translate-y-px border-[#DEDCD6]`, transition 140ms.
  No tilt, no gradient sheen overlay, no inset highlights, no
  `TILE_VISUALS` shadows.
- Content is **left-aligned and top-anchored**, not centred.
- Chip: square, `clamp(26px,3.4vh,34px)`, radius `clamp(7px,1vh,9px)`,
  background `chipTint(tile.color_index)`, text `chipColor(tile.color_index)`,
  weight 700, size `clamp(.6875rem,1.35vh,.8125rem)`, showing
  `getInitials(tile.title)` as it does today.
- Title: `clamp(.8125rem,1.62vh,.9375rem)`, weight 600, line-height 1.32,
  colour `ink`, **`line-clamp-2`**.
- Count: `mt-auto`, `clamp(.6875rem,1.2vh,.75rem)`, colour `ink-muted`, only
  rendered when `linkCount > 0`.
- Padding `clamp(10px,1.5vh,15px) clamp(11px,1.5vh,16px)`.
- The card is `flex flex-col min-h-0 min-w-0 overflow-hidden`.

**The clipping rule, and why it matters.** v1 of this design clipped titles.
The cause was a three-line clamp inside a fixed-height grid row: the text box
was taller than the row, so the third line was sliced through the middle of
the glyphs. Two lines plus `overflow-hidden` plus `min-h-0` on every flex
ancestor makes overflow impossible — text ends in an ellipsis or not at all.
**Never raise the clamp to three lines.**

At `max-height: 600px` the chip and the count hide and the title keeps the
whole card. Implement with the same
`[@media(max-height:600px)]:hidden` arbitrary variant the current code
already uses at 560px. Note the threshold moves 560 → 600 because the new
layout spends height on a real header and footer.

### EmptyCell.tsx

- Resting: `border border-dashed border-edge-soft rounded-tile bg-white/35`,
  no glyph, no inner shadow.
- Drag-over: solid border in `ink-faint`, background `white`, and a centred
  `+` in `ink-muted`. Keep the existing click-to-create and drop handlers.

### Footer

The board footer holds the add control and the palette control, as in the
target. `FloatingActions` keeps all of its behaviour; only its container
styling changes to `bg-surface-card border border-edge shadow-card` pills.

**Tests to add** — `src/test/TileCard.test.tsx`:
- A long title renders with the `line-clamp-2` class and **not** `line-clamp-3`
  (this is a cheap guard; it will not catch a layout regression, only a
  deliberate change back).
- The chip's inline colour equals `chipColor(tile.color_index)`.
- The count element is absent when the tile has no links.

**Acceptance**: four gates green.

**Commit**: `feat(ui): restyle tiles to neutral cards with per-tile chip colour`

---

## 8. Phase 3 — everything else, then cleanup

Every remaining surface moves to the same language. None of these has a target
file; compose them from the tokens and the patterns established in Phases 1–2.
When in doubt, the rule is: white surface, one `border-edge`, one
`shadow-card`, `rounded-tile` or `rounded-lg`, text in the `ink` ramp, and no
colour except a tile's own chip colour.

- `TilePanel.tsx` — header tint becomes `chipTint(tile.color_index)`;
  `getButtonStyles` in `utils/color.ts` currently manufactures 3D raised
  buttons from the accent colour. Replace its output with flat token-based
  styles, or delete it and inline the classes if nothing else uses it.
- `PanelColorPicker.tsx` — **must** display `CHIP_COLORS`, not
  `palette.colors`. Otherwise the swatch a user picks is not the colour they
  get. This is the one behavioural trap in this phase.
- `PanelEmojiPicker`, `PanelLinkItem`, `PanelTempLinkItem`
- `TileSubmenu.tsx` — chip via `chipColor` / `chipTint`
- `PasteLinkModal.tsx` — tile dots via `chipColor`
- `PaletteSelector.tsx` — unchanged in function; restyle the popover
- `UserMenu.tsx` — now lives in the sidebar foot
- `DocumentEditor.tsx`
- `ui/Modal.tsx`
- `LoginPage.tsx`
- The three loading / error states in `App.tsx` (`bg-stone-100` →
  `bg-surface-page`, spinner in `ink-faint`)

### Cleanup, in this phase

- `grep -rn "#[0-9A-Fa-f]\{6\}" src/components/ src/App.tsx` must return
  nothing. Palette hexes live in `src/types/palette.ts`; chip hexes live in
  `src/lib/chipColors.ts`. Nowhere else.
- No file over 300 lines: `find src -name '*.tsx' -o -name '*.ts' | xargs wc -l | sort -n | tail`
- Remove any now-unused export from `utils/color.ts`
  (`getComplementaryColor` and `isLightColor` were both only needed because
  content sat on coloured surfaces — check before deleting).
- Update `CLAUDE.md`: the component list still names `OverviewMode`,
  `OverviewPageCard`, `PageTitleDisplay` and `useWelcomeBack`. Replace with
  `AppShell`, `Sidebar/Sidebar`, `Sidebar/PageRow`. Add a short **Design**
  section stating the token names, the chip-colour rule, the two-line clamp
  rule and the anchoring rule, and pointing at `docs/targets/`.
- Add one item to `docs/backlog.yaml` (no `id`, `status: open`):
  "Mobile drawer visual polish — deferred from the 2026-08-22 visual refresh".

**Acceptance**: four gates green, both greps clean, no file over 300 lines.

**Commit**: `feat(ui): complete visual refresh across panels, modals and menus`

---

## 9. Definition of done

- [ ] Four phases committed to `main`, four commits, working tree clean.
- [ ] `npm run typecheck && npm run lint && npm run test && npm run build` all
      green from a clean tree.
- [ ] `grep -rn "OverviewMode\|OverviewPageCard\|PageTitleDisplay\|useWelcomeBack\|showOverview" src/` → empty.
- [ ] `grep -rn "#[0-9A-Fa-f]\{6\}" src/components/ src/App.tsx` → empty.
- [ ] No file in `src/` over 300 lines.
- [ ] New tests exist and pass: `chipColors.test.ts`, `Sidebar.test.tsx`,
      `TileCard.test.tsx`. No previously-passing test was deleted or weakened
      to make the suite green — if an existing test asserted something the
      redesign deliberately changed, update the assertion and say which one in
      the report.
- [ ] `docs/REPORT_visual_refresh.md` written, containing: the starting SHA,
      the four commit SHAs, every deviation from this spec with its reason,
      anything you had to decide that §1 did not cover, and any behaviour you
      could not preserve.

There is no automated visual gate — this repo has no browser test tooling and
adding some is out of scope. Correctness of the *look* is verified by Ashish
against the three target files after the run. Everything mechanical above is
your responsibility and is checkable without him.

---

## 10. Stop-and-report conditions

Stop, commit nothing further, and write what you found if:

- The starting tree is not clean.
- A target file and this spec disagree on something that matters.
- Preserving an existing behaviour requires changing a target.
- You believe a new dependency is genuinely required.
- A gate cannot be made green without weakening a test or changing production
  behaviour beyond this spec's scope.

A phase that reports "complete" with no implementation, tests that could not
run, or failures dismissed as pre-existing without proof, is not complete. If
a failure predates your work, prove it by checking out the starting SHA and
showing the same failure there.
