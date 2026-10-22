# SPEC — Tile text: smaller badge, count on top row, whole lines only

Version 1 · written 2026-10-22 13:10 PDT · repo: tilespace (allyourbeta/tilespace)

## What Ashish will SEE change (the complete list)

1. The coloured initials badge on each tile shrinks from 40px to 24px. Its letters shrink from 16px to 11px. Same colours.
2. The item count ("2 items") moves from the bottom of the tile to the top row, on the right, level with the badge. It sits about 18px in from the right edge so the hover drag handle never covers it.
3. Titles get the freed space. On his current desktop window that is 3 full lines instead of 2 and a sliced third.
4. A title never shows a half-cut line again. It shows whole lines, and "..." only when the text truly does not fit.
5. Phone tiles get the same badge and top-row layout.

Not changing: colours, font, title size, tile size, grid, short-window behaviour (under 600px tall the badge and count still hide), Master View cards, sidebar, tile hover tooltip.

If a change is not on this list, do not make it.

Target: `docs/targets/TARGET_tile_text.html`. Match its structure and values. Its fixed 207x131 tile size is illustration only.

## What was checked before writing this (against the source export of 2026-10-22 12:56)

- `src/components/TileCard.tsx` (128 lines): badge is a 40x40 span with `mb-[10px]`, `text-ts-body`; title is an `h3` with `flex-1 min-h-0 overflow-hidden` and `WebkitLineClamp: titleLines`; count is a bottom `mt-auto` span with `text-ts-meta`; badge and count carry `[@media(max-height:600px)]:hidden`; the grip icon is absolute `top-2.5 right-2.5`, `w-4 h-4`.
- `src/hooks/useFittingLines.ts` (42 lines): measures the SAME element it clamps. That is the root cause of the sliced line, see Part 1.
- `tailwind.config.js`: `ts-tile` = 1.0625rem / line-height 1.3 (22.1px at 17px). `ts-meta` = 0.875rem / 1.35.
- `src/test/TileCard.test.tsx`: 4 tests; one asserts a `webkitLineClamp` on the `h3`.
- `CLAUDE.md` "Two-line clamp rule" says titles are `line-clamp-2`, never 3. The code already moved past that (measured lines, up to 6). Part 3 rewrites the rule.
- `package.json` scripts: `test` = `vitest run`, `typecheck` = `tsc --noEmit -p tsconfig.app.json`, `build` = `vite build` (does NOT type-check, despite CLAUDE.md), `lint` = `eslint .`.
- No Playwright, no `.mcp.json` in the repo. No new dependencies in this spec.
- No backlog item exists for this in `docs/backlog.yaml`.

## Starting state

Record `git rev-parse --short HEAD` and `git status --short` in the report. If the tree has unrelated changes, leave them alone, do not commit them, and list them in the report. Do not create a branch.

## Part 1 — Fix the sliced line (root cause)

Tier: fast (vitest). Expected time: 15 min.

Root cause: `useFittingLines` measures the `h3` and also clamps it. Chrome's `-webkit-line-clamp` does not shorten a box whose height comes from flex. The `h3` stays 2.4 lines tall, the ellipsis lands after line 2, and line 3 paints into the leftover space, cut off by `overflow-hidden`.

Fix: measure one element, clamp another.

1. Add a pure function `fitLines(availablePx, lineHeightPx, min, max)` in `src/utils/fitLines.ts`, exported from `src/utils/index.ts`. Return `min` if `lineHeightPx` is not finite or not positive. Otherwise `floor(availablePx / lineHeightPx + 0.01)`, clamped to `[min, max]`. The `+ 0.01` is required: `66.3 / 22.1` evaluates to `2.9999999999999996` in JS.
2. `useFittingLines` uses `fitLines` and returns `{ ref, lines, lineHeight }` (line height in px, as measured).
3. In `TileCard`, the ref goes on a new wrapper `div` with `flex-1 min-h-0` and the title font classes (`text-ts-tile font-semibold tracking-[-.008em]`). The `h3` sits inside it, inherits the font, and gets `display:-webkit-box`, `WebkitBoxOrient: vertical`, `WebkitLineClamp: lines`, `overflow: hidden`, and `maxHeight: lines * lineHeight` px. Never put the max-height on the measured wrapper. That would stop lines from growing when the window grows.

Tests:
- `src/test/fitLines.test.ts`: 53/22.1 → 2; 101/22.1 → 4; 66.3/22.1 → 3; 0 → min; huge → max; lineHeight 0 or NaN → min.
- In `TileCard.test.tsx`, replace the clamp test with one that stubs the layout engine only: a fake `ResizeObserver` that calls its callback once, `clientHeight` = 53 on the measured element, and `window.getComputedStyle` returning `lineHeight: '22.1px'`. Assert the `h3` has `webkitLineClamp` 2 and `maxHeight` ≤ 44.2px. Run this test against the current code first and confirm it FAILS (no max-height). Say so in the report.
- Do not stub `fitLines` or `useFittingLines` inside the TileCard test.

## Part 2 — Badge and top row (the visible change)

Tier: fast. Expected time: 15 min.

In `TileCard`, replace the badge span and the bottom count span with one top-row `div`:
- `flex-none flex items-center justify-between pr-[18px] mb-2 [@media(max-height:600px)]:hidden`
- Left: badge span, `w-6 h-6 rounded-[7px] text-[11px] font-bold tracking-[.015em]`, same `chipTint` / `chipColor` inline styles, same `getInitials`.
- Right: the count span, only when `linkCount > 0`, `text-ink-muted text-ts-meta`, same wording ("1 item" / "N items").
- Remove the old bottom count span entirely.

Leave the grip icon, drag handlers, rings, INSERT/SWAP badge, and card classes untouched.

Tests (add to `TileCard.test.tsx`):
- The badge and the count share one parent element, and that parent comes before the title in DOM order. Confirm this test FAILS against the current code first.
- The badge's inline colour still equals `chipColor(color_index)` (existing test, keep it).
- The no-links / has-links count tests still pass unchanged.

## Part 3 — Project instructions

Tier: none. Expected time: 2 min.

In `CLAUDE.md`, replace the "Two-line clamp rule" bullet with:

> **Whole-line rule**: a tile title shows only whole lines. `useFittingLines` measures a wrapper; the `h3` inside gets `WebkitLineClamp` = lines AND `maxHeight` = lines × line-height. Never measure and clamp the same element: Chrome then paints a sliced extra line. Reference: `docs/targets/TARGET_tile_text.html`.

Also correct the Testing section: `npm run build` does not type-check; type-check is `npm run typecheck`.

## Exit gate (run once, at the end)

`npm run typecheck && npm run lint && npm run build && npm run test`

All four must pass. No file over 300 lines.

## Report and commit

Write `docs/REPORT_tile_text.md`: starting SHA, files changed, the red-before-green result from Part 1, gate output summary. Split it into PROVEN (what the tests and gate show) and UNVERIFIED. The on-screen look is UNVERIFIED until Ashish sees it. Do not write "done".

Commit everything in one commit: `Tiles: smaller badge, count on top row, whole-line titles`. Do not push. Do not deploy.

## Pre-answered questions

- Badge letters at 11px look small? Ship 11px. It matches the approved target.
- Should the Master View cards change too? No.
- `text-[11px]` is not a type-scale token. Fine, use the arbitrary value; do not add a token.
- Mobile tiles have auto height. Leave the mobile grid alone; the same TileCard change applies.
- Tests fail for an unrelated reason? Fix only if caused by this change. Otherwise note it in the report and carry on.
