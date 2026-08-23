# SPEC — TileSpace visual refresh, follow-up fixes

**Spec version:** 1.0
**Written:** 2026-08-23 00:21 PT
**Follows:** `docs/specs/SPEC_visual_refresh_2026-08-22.md`, which shipped in
four phases ending at `c9fb960`.
**Executor:** one agentic Claude Code session, three phases, run start to
finish.

Three defects found in the live review. Each is a separate phase with its own
commit. They are independent — a problem in one does not block the others.

---

## 0. Decisions already made — do not ask

1. The bottom-left controls move into the layout's normal flow. This finishes
   the move the previous spec asked for; it is not a z-index or offset fix.
2. Tile titles get **two or three lines depending on available height**,
   computed, not guessed. Three is the maximum. Never four.
3. The tile panel is restyled to the two new target files. Its behaviour does
   not change, with one exception: the full-panel green "Saved" overlay is
   removed (agreed with Ashish).
4. No new dependencies. No new database columns. No behaviour changes beyond
   item 3's exception.
5. Work on `main`, commit at the end of each phase.

---

## 1. Starting state

```bash
git rev-parse HEAD    # expect c9fb960 or later; record it in the report
git status            # must be clean; if not, stop and report
npm ci
```

Gates, all four green at the end of every phase:

```bash
npm run typecheck && npm run lint && npm run test && npm run build
```

Two test failures are known to pre-date this work and are documented in
`docs/REPORT_visual_refresh.md` — an orphaned `react-router-dom` import in an
unused `AuthGuard.tsx`, and a stray duplicate `App.tsx` at the repository
root. Leave both alone; they are a separate cleanup. Do not let them grow: if
a *new* failure appears, it is yours.

Project rules still apply: no file over 300 lines, components render only,
Supabase access only in `src/api/`, `@/` import alias, barrel exports.

---

## 2. Phase A — the bottom-left collision

### The defect

Three separately-positioned things occupy the same corner of the viewport:

- `FloatingActions` (the `+` menu and the palette pills), still `fixed`
- `UserMenu` (the avatar and its build-info tooltip), still `fixed`
- the sidebar's collapse toggle, in the sidebar's foot

They overlap. In the review screenshot the user's email is legible *through*
the palette pills. The previous spec placed the add and palette controls in
the board footer's normal flow and `UserMenu` in the sidebar foot; the
executor left both fixed and recorded the deviation. This phase completes that
move.

### What to do

**`FloatingActions.tsx`** — remove `fixed` positioning entirely. It becomes an
ordinary child of the board footer that `AppShell` already renders, laid out
left-to-right in normal flow at `LAYOUT.GUTTER_PX` from the left edge.

Everything about its behaviour stays: the hover-to-open menu, the
`CLOSE_GRACE_MS` grace timer, the tile submenu, the click-outside handling on
mobile, and the palette selector it hosts. Only the positioning and the
container styling change. The popover it opens should now open **upward** from
the footer; if it currently assumes downward, flip it.

**`UserMenu.tsx`** — remove `fixed bottom-4 right-4`. It renders inside the
sidebar foot, as the target shows: a 26px round avatar, then the user's
display name in `ink-2` at `.8125rem`, truncated, then the collapse toggle.

- Its dropdown (email + Sign Out) opens **upward** from the avatar.
- When the sidebar is collapsed, only the avatar shows, stacked above the
  toggle. The dropdown still works.
- **Keep the build-info tooltip.** `__BUILD_HASH__` and `__BUILD_TIME__` are
  how Ashish tells whether he is looking at a fresh build; this is a standing
  requirement, not decoration. It stays on hover over the avatar, and it must
  remain readable in both the expanded and collapsed sidebar states.

**`AppShell.tsx`** — the footer is a real flex row: `FloatingActions` at the
left, nothing centred on desktop, nothing at the right. On mobile it keeps
`PageDots` in the middle as the previous spec established.

### Verification

- `grep -rn "fixed bottom" src/components/` returns nothing.
- With the sidebar expanded and again collapsed, at a 1440×900 viewport and at
  1280×720, no two interactive elements overlap in the bottom-left. State this
  explicitly in the report — you cannot screenshot, so reason it from the
  computed layout and say what you checked.
- The build tooltip is still reachable.

**Commit**: `fix(ui): move floating controls and user menu into layout flow`

---

## 3. Phase B — adaptive title line count

### The defect

`TileCard` hard-clamps titles to two lines. On Ashish's screen the tiles are
roughly 250px tall holding about 90px of content, so a third line fits with
room to spare — and titles like *"Answer the question that you want to
answer"* are being truncated for no reason.

### Why it was written that way, and what not to do

The two-line cap was my correction of an earlier bug where a three-line clamp
inside a fixed-height grid row sliced the third line through the middle of the
glyphs. The lesson was real; the fix over-corrected. **Do not simply change
the clamp to three** — that reintroduces the original bug on short windows and
at the 5-row capacity.

The correct fix is to compute how many lines actually fit.

### Implementation

Add a pure function to `src/utils/grid.ts`:

```ts
/**
 * How many lines a tile title may occupy before it would overflow its row.
 *
 * The grid gives every row an equal share of the leftover viewport height, so
 * the answer depends on both the viewport and the current capacity tier
 * (4 rows at 16 tiles, 4 at 20, 5 at 30). Two is the floor, three the ceiling:
 * beyond three a title stops being a label and starts being a paragraph.
 */
export function maxTitleLines(rows: number, viewportHeight: number): 2 | 3
```

Derive it, do not hard-code thresholds. The arithmetic, using the existing
`LAYOUT` constants:

```
boardHeight   = viewportHeight - HEADER_HEIGHT_PX - FOOTER_HEIGHT_PX - 6
rowHeight     = (boardHeight - (rows - 1) * GRID_GAP_PX) / rows
```

Inside a tile, at the clamp's own upper bound (`clamp()` maxima, since that is
the worst case): vertical padding 15px × 2, chip 34px, chip margin 10px, count
line 17px reserved, and a title line box of 20px (0.9375rem × 1.32).

```
available = rowHeight - 30 - 34 - 10 - 17
lines     = clamp(floor(available / 20), 2, 3)
```

Below the `max-height: 600px` breakpoint the chip and count are hidden, so
drop those two terms from `available` in that branch.

Wire it up:

- New hook `src/hooks/useViewportHeight.ts` — returns `window.innerHeight`,
  updated on `resize`, throttled with `requestAnimationFrame`, cleaned up on
  unmount. Follow the shape of the existing `useIsMobile`.
- `useTileGrid` computes `maxTitleLines(rows, viewportHeight)` and passes it to
  each `TileCard` as a `titleLines` prop.
- `TileCard` applies `line-clamp-2` or `line-clamp-3` from that prop. Both
  literal class strings must appear in the source so Tailwind's content scanner
  emits them — do **not** build the class name by interpolation
  (`line-clamp-${n}` will be purged and silently produce no clamp at all, which
  is exactly the slicing bug returning).

### Tests

`src/test/grid.test.ts`, extending the existing file:

- A tall viewport at 4 rows returns 3.
- A short viewport (e.g. 640px) at 5 rows returns 2.
- The function never returns anything but 2 or 3, across a sweep of heights
  from 400 to 2000 at both 4 and 5 rows.
- It is monotonic: increasing the viewport never decreases the line count.

`src/test/TileCard.test.tsx`:

- `titleLines={3}` renders `line-clamp-3`; `titleLines={2}` renders
  `line-clamp-2`. Replace the existing assertion that hard-codes
  `line-clamp-2` and *not* `line-clamp-3` — that test now encodes the bug.
  Note the replacement in the report.

**Commit**: `fix(ui): size tile title clamp to available row height`

---

## 4. Phase C — the tile panel

### The defect

`TilePanel` and its children are the last surface on the old visual language,
and the previous pass made it worse rather than better: it re-pointed the
accent colour at the new chip palette without changing the treatment, so the
panel now has a saturated tinted header block, a filled primary button, and a
full-width red `Delete Tile` slab in a UI that is otherwise white and neutral.

### The targets

Two new read-only target files in `docs/targets/`:

| File | State |
|---|---|
| `TARGET_tilepanel_empty.html` | A tile with no links |
| `TARGET_tilepanel_links.html` | A tile with four links, one of them a note |

`docs/targets/generate_panel_targets.py` generated both; read it for exact
values. **Do not edit the targets.** If code and target conflict, stop and
report.

### What changes, surface by surface

**`TilePanel.tsx`**

- Panel container: white, `border border-edge`, `rounded-l-[14px]`, shadow
  `-16px 0 48px rgba(28,27,25,.13)`. Scrim drops from `bg-black/30` to
  `rgba(28,27,25,.20)`.
- Drag handle: 22px tall, no grey bar background, just a 34×3 rounded grip in
  `#E0DED8`.
- **The tinted header block is deleted.** Both `backgroundColor:
  tile.accent_color + '15'` blocks go. The header sits on plain white.
- Header row: emoji button, colour button, spacer, close button — all 34px
  (close 30px), `border-edge`, `bg-[#FCFCFB]`, no shadows, no scale-on-hover.
- Title input becomes the panel's `h1`-equivalent: `1.375rem`, weight 700,
  tracking `-.022em`, transparent background, no border. It is the largest
  text in the panel.
- A single 1px `edge-soft` rule separates header from body. No other rules
  except above the footer.
- **Colour appears in exactly two places**: the colour-picker swatch, and the
  primary button's fill. Both take `chipColor(tile.color_index)`. Nothing else
  in the panel is coloured.
- Buttons: 36px tall, `rounded-[9px]`, `border-edge`, white, `ink-2` text,
  `shadow-card`. The primary variant fills with the tile's chip colour and
  uses white text. `getButtonStyles` in `utils/color.ts` manufactured 3D raised
  styles — delete it and its export, and check nothing else imports it.
- `Delete Tile` becomes `Delete tile`: a borderless text button, centred under
  the actions, `.8125rem` in `ink-muted`, turning `#B91C1C` on `#FEF2F2` on
  hover. **Both confirm dialogs stay exactly as they are.**
- **Remove the green "Saved" overlay** and the `showSaved` state that drives
  it. `saveAndClose` keeps its 600ms delay and its update call — only the
  visual is removed. Agreed with Ashish.
- The paste-flash banner stays but restyles: `bg-[#F6F5F2]`, `ink-2` text, no
  green.

**`PanelLinkItem.tsx`** — rows lose `bg-gray-50`. Plain rows, `rounded-[9px]`,
`hover:bg-[#F6F5F2]`. Icon in `ink-faint`, or the tile's chip colour for a
document. Title `.9375rem` weight 500 in `ink`, summary `.8125rem` in
`ink-muted`. Edit and delete actions are 26px icon buttons at
`opacity-0`, revealed on row hover. Drag behaviour unchanged.

**`PanelTempLinkItem.tsx`** — inputs restyled to match: white, `border-edge`,
`rounded-[9px]`, focus ring in `ink-faint` rather than a colour.

**`PanelColorPicker.tsx`** — **verify this first.** The previous spec required
it to show `CHIP_COLORS` rather than `palette.colors`, because otherwise the
swatch a user picks is not the colour they get. If that landed, restyle only:
popover in white with `border-edge` and `shadow-cardHi`, swatches 32px
`rounded-[9px]`, selected one ringed in `ink-faint`, and drop the
"{palette.name} palette" caption, which no longer describes what is shown. If
it did **not** land, fix it here and say so in the report.

**`PanelEmojiPicker.tsx`** — same popover treatment.

### Tests

`src/test/TilePanel.test.tsx`:

- No element in the rendered panel carries a background derived from
  `tile.accent_color` (the old `+ '15'` tint is gone).
- The delete control renders as a button with accessible name "Delete tile"
  and does **not** carry `bg-red-500`.
- `showSaved` no longer exists: closing does not render a "Saved" element.
- The primary action's inline colour equals `chipColor(tile.color_index)`.

Do not weaken any existing panel test to make these pass. If an existing
assertion contradicts the new design, update it and name it in the report.

**Commit**: `feat(ui): restyle tile panel to the neutral design language`

---

## 5. Definition of done

- [ ] Three phases, three commits on `main`, working tree clean.
- [ ] All four gates green, with no new failures beyond the two documented
      pre-existing ones. If you claim a failure is pre-existing, prove it by
      checking out the starting SHA and showing the same failure there.
- [ ] `grep -rn "fixed bottom" src/components/` → empty.
- [ ] `grep -rn "accent_color" src/components/` → empty (the column is still
      written on create in `src/api/` and `src/state/`; it must no longer drive
      any pixel).
- [ ] `grep -rn "#[0-9A-Fa-f]\{6\}" src/components/ src/App.tsx` → empty.
- [ ] `grep -rn "getButtonStyles" src/` → empty.
- [ ] Both `line-clamp-2` and `line-clamp-3` appear as literal strings in
      `TileCard.tsx`.
- [ ] No file in `src/` over 300 lines.
- [ ] `docs/REPORT_followup_fixes.md` written: starting SHA, the three commit
      SHAs, every deviation and why, every test you changed and why, and
      anything §0 did not cover that you had to decide.

No automated visual gate exists in this repo and none is being added. Ashish
reviews the result against `docs/targets/` afterwards.

---

## 6. Stop and report if

- The starting tree is not clean.
- A target and this spec disagree on something that matters.
- Preserving an existing behaviour would require changing a target.
- You believe a new dependency is required.
- A gate cannot go green without weakening a test or changing behaviour beyond
  this spec's scope.
