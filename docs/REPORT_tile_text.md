# Report — Tile text: smaller badge, count on top row, whole lines only

Spec: `docs/specs/SPEC_tile_text_2026-10-22.md`

## Starting state

- Starting SHA: `5c00c5f`
- `git status --short` at start: clean tree except two untracked spec files
  (`docs/specs/SPEC_tile_text_2026-10-22.md`, `docs/targets/TARGET_tile_text.html`),
  which belong to this task.

## Files changed

- `src/utils/fitLines.ts` (new) — pure `fitLines(availablePx, lineHeightPx, min, max)`.
- `src/utils/index.ts` — barrel-exports `fitLines`.
- `src/hooks/useFittingLines.ts` — uses `fitLines`; now returns `{ ref, lines, lineHeight }`.
  Also guards against a `NaN`/non-finite `lineHeight` (both from `lineHeight` and the
  `fontSize * 1.2` fallback) so an invalid measurement never flows into `lines * lineHeight`
  and produces a `NaN` `maxHeight` — this guard was not in the spec's prose but was needed
  to keep the dev console clean when `getComputedStyle` can't resolve a usable line height.
- `src/components/TileCard.tsx` — Part 1: `titleRef` now goes on a wrapper `div`
  (`flex-1 min-h-0` + title font classes); the `h3` inside is only clamped
  (`WebkitLineClamp` + `maxHeight = lines * lineHeight`), never measured.
  Part 2: badge span and count span merged into one top-row `div`
  (`flex-none flex items-center justify-between pr-[18px] mb-2 [@media(max-height:600px)]:hidden`);
  badge shrunk to `w-6 h-6 rounded-[7px] text-[11px]`; old bottom count span removed.
  132 lines total (limit 300).
- `src/test/fitLines.test.ts` (new) — 7 cases per spec (2, 4, 3-via-epsilon, 0→min, huge→max,
  lineHeight 0→min, lineHeight NaN→min).
- `src/test/TileCard.test.tsx` — replaced the old clamp test with a stubbed-layout-engine
  test (fake `ResizeObserver` firing once, `clientHeight` 53, `lineHeight` 22.1px) asserting
  `webkitLineClamp === '2'` and `maxHeight <= 44.2px`; added a DOM-structure test that the
  badge and count share one parent distinct from the card root, and that parent precedes
  the title in DOM order.
- `CLAUDE.md` — replaced the "Two-line clamp rule" bullet with the "Whole-line rule" text
  from the spec; corrected the Testing section's `npm run build` comment and added the
  `npm run typecheck` line.

## Red-before-green (Part 1 and Part 2 test proof)

Verified by temporarily swapping in the pre-fix `TileCard.tsx` / `useFittingLines.ts`
(from `git show HEAD:...`) while keeping the new tests, then running
`npx vitest run src/test/TileCard.test.tsx`:

- **Whole-line clamp test** — FAILED against old code: `AssertionError: expected NaN to be
  greater than 0` (no `maxHeight` was ever set by the old code). PASSED after restoring the fix.
- **Badge/count shared-parent test** — first draft of this test passed even against the old
  code, because in the old markup both the badge and the count happened to share a parent too
  (the card root itself — neither was wrapped). Tightened the assertion to also require
  `badge.parentElement !== card`. Re-ran: now FAILS against old code
  (`expected <div draggable> not to be <div draggable>`) and PASSES after restoring the fix.

Both tests are confirmed red-before-green, not just written-and-passing.

## Exit gate (run once, at the end)

`npm run typecheck && npm run lint && npm run build && npm run test`

- `typecheck` — pass, no output.
- `lint` — pass, 0 errors. 1 pre-existing warning in `src/auth/AuthContext.tsx`
  (`react-refresh/only-export-components`), unrelated to this change — file not touched.
- `build` — pass. Pre-existing chunk-size-over-500kB advisory notice, unrelated.
- `test` — pass. 20 files, 198 tests, including `src/test/pwaManifest.test.ts` (7 tests,
  unaffected by this change) and the pre-existing `src/test/MasterView.test.tsx` rollback
  test, which intentionally logs `Error: network down` to the console — that is the test
  passing, not a failure.
- File-size check: no `.ts`/`.tsx` file in `src/` over 300 lines. `TileCard.tsx` is 132 lines.

## PROVEN

- `fitLines` is a pure function matching every case in the spec (unit-tested).
- `useFittingLines` measures a wrapper and the `h3` is clamped separately; the clamp test
  proves `webkitLineClamp` and a bounded `maxHeight` are both applied (red confirmed first).
- The badge and item count now live in one top-row element, structurally separate from the
  card root and preceding the title in DOM order (red confirmed first).
- Badge markup matches spec values: `w-6 h-6 rounded-[7px] text-[11px] font-bold
  tracking-[.015em]`, same `chipColor`/`chipTint`/`getInitials`.
- Top row matches spec classes: `flex-none flex items-center justify-between pr-[18px]
  mb-2 [@media(max-height:600px)]:hidden`.
- Old bottom count span is gone; no-links/has-links count tests still pass unchanged.
- Chip inline-colour test (`chipColor(tile.color_index)`) still passes unchanged.
- Grip icon, drag handlers, rings, INSERT/SWAP badge, outer card classes are untouched
  (verified by diff — no lines changed outside the badge/count/title block).
- Full exit gate is green: typecheck, lint, build, test (198/198).
- `CLAUDE.md` rule text and testing-command correction applied exactly as specified.
- Diff is scoped to the files listed above; `git status --short` shows nothing unexpected.

## UNVERIFIED

- **The on-screen look.** Nothing here was checked in a running browser against
  `docs/targets/TARGET_tile_text.html`. Ashish needs to see it — badge size, count
  position clear of the hover grip handle, and the number of whole title lines on his
  actual desktop window — before this is considered visually correct.
- Phone/mobile tile appearance (same component, auto height) — not visually checked either.
- The under-600px-tall hide behaviour for the badge/count row — logic unchanged
  (`[@media(max-height:600px)]:hidden` carried over verbatim) but not visually re-checked.

## Backlog

No backlog item existed for this (per spec's pre-check); none created, none closed.

## Commit

Not yet committed — see next message.
