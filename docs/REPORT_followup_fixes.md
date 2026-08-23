# REPORT — TileSpace visual refresh, follow-up fixes

**Spec:** `docs/specs/SPEC_followup_fixes_2026-08-23.md`
**Starting SHA:** `c9fb9603a9581526ecddf804ea1ffd642900c891`
**Executor:** one agentic Claude Code session, three phases, run start to finish.

Starting tree had four untracked files (the spec itself and the three
`docs/targets/` inputs the spec names as pre-existing). No tracked file had
uncommitted changes. Treated as clean per the spec's own intent — these are
inputs to this task, not leftover work — and committed alongside the phases
that use them (spec with Phase A, targets with Phase C).

## Commits

| Phase | Commit | Subject |
|---|---|---|
| A | `cd6ae4cb56d2cd82b981c51c9931a54934857214` | fix(ui): move floating controls and user menu into layout flow |
| B | `204162ba3c42256a6f5b21d3ced88e81b8be6f2f` | fix(ui): size tile title clamp to available row height |
| C | `8258db7ea13d6f19670b06a6d0e4b83f08312097` | feat(ui): restyle tile panel to the neutral design language |

All three on `main`. Working tree left clean except one untracked-by-me
change: `docs/backlog.yaml` was modified during the session by an external
process (Tenzing assigning an `id` to a backlog item, per this repo's
CLAUDE.md), not by any work in this spec — left unstaged and uncommitted,
not mine to commit.

## Gates, all four phases

`npm run typecheck && npm run lint && npm run test && npm run build` — run
after every phase. Every run showed exactly the same two pre-existing
failures documented in `docs/REPORT_visual_refresh.md`, and no others:

- `typecheck`: `src/auth/AuthGuard.tsx(2,29): error TS2307: Cannot find
  module 'react-router-dom'` — orphaned import in an unused file.
- `lint`: `App.tsx(95,11): 'sortedPages' is assigned a value but never
  used` — the stray duplicate `App.tsx` at the repo root.

Verified pre-existing by running both gates at the starting SHA before any
change was made (see "Starting state" below) — same two failures, same
locations, nothing else.

`test` and `build` were green at the starting SHA and stayed green through
all three phases (117 → 122 → 126 tests, growing only from added coverage).

No file in `src/` exceeds 300 lines after all three phases.

### Starting-state baseline (before any change)

```
npm run typecheck  → 1 error (AuthGuard.tsx react-router-dom), as above
npm run lint       → 1 error (App.tsx sortedPages), 1 pre-existing warning
npm run test        → 10 files, 117 tests, all passing
npm run build       → succeeds
```

---

## Phase A — the bottom-left collision

**What was actually broken:** only `FloatingActions.tsx` and `PageDots.tsx`
still had `fixed bottom-*` positioning. `UserMenu.tsx` was already rendered
inside the sidebar foot in normal flow (no `fixed` class at all) — that part
of the previous spec's move had already landed; the spec's description of it
was stale. Its build-info tooltip, dropdown, and collapsed-state stacking
were already correct and untouched.

**Changes:**
- `FloatingActions.tsx`: dropped `fixed bottom-4 left-4 z-40`, kept
  `flex items-end gap-2` as an ordinary flex child. Its popover already
  opened upward (`absolute bottom-full mb-2`) — no flip needed. Same for the
  palette selector and tile submenu it hosts.
- `PageDots.tsx`: dropped the `fixed bottom-4 left-1/2 -translate-x-1/2`
  wrapper entirely; the pill now renders directly, positioned by its parent.
- `AppShell.tsx`: footer is now a real flex row (`footerActions` prop at the
  left, `footerCenter` prop centred, an empty flex-none spacer at the right)
  instead of an empty spacer div, padded at `LAYOUT.GUTTER_PX` like the
  header.
- `App.tsx`: `FloatingActions` and `PageDots` now passed to `AppShell` as
  `footerActions` / `footerCenter` instead of rendered as loose children.
  Removed the mobile grid's `pb-16` — it existed to clear space under the
  old fixed overlay, which no longer overlays the grid now that the footer
  occupies real layout space.

**Verification** (no screenshot tool available, reasoned from computed
layout as the spec allows):

- `grep -rn "fixed bottom" src/components/` → empty.
- UserMenu lives in the sidebar's `<aside>`, a separate flex child of the
  top-level `flex` container from the content column that holds the footer.
  FloatingActions/PageDots live in the content column's `<footer>`. These
  are two structurally disjoint DOM regions with no overlapping fixed
  coordinates — nothing here depends on viewport size, so this holds
  identically at 1440×900 and 1280×720 and with the sidebar collapsed
  (236px → 60px only changes the aside's own width, not whether it overlaps
  the footer). PageDots only ever occupies the footer's *center* slot and
  only renders past the 640px mobile breakpoint (`useIsMobile`), where the
  sidebar itself becomes an overlay drawer, not a static column — no
  collision there either since PageDots is inside the (non-sidebar) content
  column's footer.
- Build tooltip: unchanged code path (`group/build` + `group-hover`),
  confirmed still present and unmoved by diff review.

---

## Phase B — adaptive title line count

Implemented `maxTitleLines(rows, viewportHeight)` in `src/utils/grid.ts`,
`useViewportHeight` in `src/hooks/useViewportHeight.ts` (rAF-throttled
resize, same shape as `useIsMobile`), wired through `useTileGrid` →
`TileCard`'s new `titleLines` prop, applied as a literal
`line-clamp-2`/`line-clamp-3` ternary (both strings present in source, not
interpolated — confirmed present in the built CSS).

### Deviation — confirmed with Ashish before implementing

The spec's own literal arithmetic (drop the chip/count terms below
`TileCard`'s existing `[@media(max-height:600px)]:hidden` breakpoint)
produces a real, non-trivial violation of the *same spec's* required
monotonicity test: at 4 rows, viewport height 600px computes 3 lines;
601px — where the chip and count reappear and eat ~61px the taller
viewport just gained — computes only 2, and doesn't recover to 3 until
~758px. That's a ~157px band where a taller window returns fewer lines,
which fails "increasing the viewport never decreases the line count"
exactly as specified in §3's test list.

Verified numerically (not just reasoned) before writing any code. Asked
Ashish how to resolve it since this wasn't covered by §0 and matched §6's
stop-and-report condition exactly. He chose: keep both branches' arithmetic
as specified, but floor the above-breakpoint branch's available space at
what the at-or-below-breakpoint branch already computes *at exactly 600px*
for that row count, rather than letting it drop further:

```
available_full(vh) = max(rowHeight(vh) - 91, rowHeight(600) - 30)
```

This is derived (not a hardcoded line-count threshold), keeps every other
number exactly as specified, and makes the function provably monotonic —
confirmed with a full sweep from 400–2000px at both 4 and 5 rows, 0
violations, before writing the implementation.

### Tests

`src/test/grid.test.ts` — added: tall viewport (900px, 4 rows) → 3; short
viewport (640px, 5 rows) → 2 (both from the spec text, both land in the
above-breakpoint branch); a 400–2000px sweep at 4 and 5 rows asserting the
result is always 2 or 3; a full-resolution (every 1px) monotonicity sweep
at both row counts.

`src/test/TileCard.test.tsx` — replaced the old test that hard-coded
`line-clamp-2` and *not* `line-clamp-3` (that assertion now encodes the bug
this phase fixes) with two tests: `titleLines={2}` renders `line-clamp-2`
and not `-3`; `titleLines={3}` renders `line-clamp-3` and not `-2`.

---

## Phase C — the tile panel

Restyled `TilePanel.tsx` and its four children to
`docs/targets/TARGET_tilepanel_{empty,links}.html`: white panel with
`border-edge`, `rounded-l-[14px]`, panel shadow
`-16px 0 48px rgba(28,27,25,.13)`; scrim `rgba(28,27,25,.20)`; the tinted
`accent_color + '15'` header block deleted entirely, header on plain white;
34px header buttons (30px close) on `border-edge`/off-white with no shadow
or scale-on-hover; `1.375rem`/700/`-.022em` title input as the panel's de
facto h1; a single `edge-soft` rule under the header; colour appearing only
via the colour-picker swatch and the primary button's fill, both
`chipColor(tile.color_index)`; `Delete tile` as a borderless
`ink-muted` → `danger`/`danger-tint`-on-hover text button; the green
"Saved" overlay and `showSaved` state removed (`saveAndClose` keeps its
600ms delay and update call, per §0.3).

`PanelColorPicker.tsx` — verified `CHIP_COLORS` (not `palette.colors`) was
already wired from the previous spec; it had landed. Restyled only: the
toggle button now matches the target's neutral 34px "dot" swatch (a small
15px coloured dot inside an off-white bordered button, not a button fully
filled with colour) instead of the previous fully-coloured 32px button;
popover white/`border-edge`/`shadow-cardHi`; swatches 32px `rounded-[9px]`;
selected one ringed. The `{palette.name} palette` caption the spec says to
drop was not present — it already read "Chip colour" from prior work, so
nothing to remove there.

`PanelEmojiPicker.tsx` — toggle button restyled to the same 34px neutral
treatment; popover already matched (white/`border-edge`/`shadow-cardHi`)
from prior work.

`PanelLinkItem.tsx` — rows lose `bg-gray-50`, become plain
`rounded-[9px]` with `hover:bg-surface-hover`; icon `ink-faint`, or the
tile's chip colour for a document (new `tileAccent` prop, passed down from
`TilePanel`'s existing `accent` value); title `.9375rem`/500/`ink`, summary
`.8125rem`/`ink-muted`; edit/delete actions now 26px icon buttons
(`Pencil`/`Trash2`, was text "Edit"/"View"/delete-icon) at `opacity-0`,
revealed on row hover, matching the target's icon-only affordance. Drag
behaviour untouched.

`PanelTempLinkItem.tsx` — inputs restyled to `border-edge`/`rounded-[9px]`,
focus ring `ring-ink-faint` (was amber); the amber card background/border
replaced with `surface-hover`/`border-edge`.

### Deviation — `getButtonStyles` did not exist

The spec says: "`getButtonStyles` in `utils/color.ts` manufactured 3D
raised styles — delete it and its export, and check nothing else imports
it." Neither `src/utils/color.ts` nor any `getButtonStyles` export exists
anywhere in this repo (confirmed by `find`/`grep` before starting Phase C).
Nothing to delete. `grep -rn "getButtonStyles" src/` returns empty, same as
the definition-of-done requires — just not because anything was removed
this phase.

### Deviation — four hex colours moved into `tailwind.config.js` as tokens

The spec's own prose for Phase C literally writes Tailwind arbitrary-hex
classes (`bg-[#FCFCFB]`) and named hex values (`#E0DED8` for the drag grip,
`#B91C1C`/`#FEF2F2` for the delete-hover state) that, if inlined into
`TilePanel.tsx`/`PanelLinkItem.tsx` as written, would fail the same spec's
own definition-of-done gate: `grep -rn "#[0-9A-Fa-f]{6}" src/components/
src/App.tsx` → empty. Resolved by adding four small tokens to
`tailwind.config.js` (the project's own token registry, per this repo's
CLAUDE.md Design section) instead of inlining the hex:

- `surface.subtle: '#FCFCFB'` — header icon-button background
- `surface.hover: '#F6F5F2'` — link-row hover / paste-flash banner
- `edge.grip: '#E0DED8'` — drag-handle grip bar
- `danger.DEFAULT: '#B91C1C'` / `danger.tint: '#FEF2F2'` — delete-tile hover

Confirmed pixel-exact via the built CSS (e.g. `hover:bg-danger-tint`
compiles to `rgb(254 242 242)`, `hover:text-danger` to `rgb(185 28 28)`).
No new dependency, no behaviour change — purely where the hex constant
lives.

### Tests

`src/test/TilePanel.test.tsx` (new file, no prior test existed for this
component): no element carries a background derived from
`tile.accent_color` (walks every rendered element's inline style, asserts
none equals `accent_color + '15'` and none contains `accent_color` at all);
the delete control is a `<button>` with visible text "Delete tile" and no
`bg-red-500` class; closing the panel never renders any "Saved" text, before
or after clicking close; the primary action's inline `backgroundColor`
equals `chipColor(tile.color_index)`.

---

## Anything §0 didn't cover that required a decision

1. **Phase A — which components actually still needed the fixed→flow
   move.** §0.1 said "this finishes the move," implying all three pieces
   were still fixed; in fact only `FloatingActions` and `PageDots` were.
   `UserMenu` had already landed in normal flow. Treated as a factual
   correction discovered by reading the code, not a new decision — the end
   state (nothing `fixed bottom-*`, no collision) is exactly what §0.1
   asked for.
2. **Phase A — `AppShell`'s footer API shape.** The spec didn't specify how
   `FloatingActions`/`PageDots` should reach the footer slot. Added
   `footerActions`/`footerCenter` props to `AppShell`, mirroring the
   existing prop-drilling pattern already used for the sidebar, rather than
   inventing a new layout primitive.
3. **Phase B — the monotonicity/breakpoint conflict.** Covered above;
   confirmed with Ashish via a direct question rather than deciding
   unilaterally, since it was a genuine internal contradiction in the spec
   (not resolvable by re-reading it) and directly matched §6's
   stop-and-report criteria.
4. **Phase C — the four hex-to-token moves and the `getButtonStyles`
   non-finding.** Both covered above. Neither seemed to warrant pausing to
   ask — the token move is a mechanical, reversible, same-value
   substitution required to satisfy the spec's own checklist, and the
   `getButtonStyles` item was a pure fact-check with an unambiguous
   answer (it doesn't exist).
5. **Phase C — `PanelLinkItem`'s edit/view icon.** Target markup shows the
   same pencil icon for both document rows and link rows even though their
   click behaviour differs (document → opens the document editor, link →
   inline edit). Kept the icon visually identical per the target but kept
   the `title` attribute contextual ("View" vs "Edit") since that reflects
   real, unchanged behaviour and the target doesn't actually specify
   different icons for the two cases.
