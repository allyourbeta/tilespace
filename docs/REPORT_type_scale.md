# REPORT — TileSpace type scale

**Spec:** `docs/specs/SPEC_type_scale_2026-08-23.md`
**Starting SHA (recorded at spec handoff):** `d861ec893d80b403b1c345a03efd4f7668251600`

## Pre-phase housekeeping (separate commit)

The tree was not clean at the start: `docs/backlog.yaml` had an uncommitted
Tenzing-assigned `id`, and `package-lock.json` had uncommitted dependency
lockfile drift from an earlier session. Neither touches anything this phase
changes. Per the user's direction, these were committed separately first, in
`9de005ae2dab73c3262c3ca556f06f191ec7fa65`, so the type-scale work itself
starts from a clean tree and lands in its own single commit.

**Type-scale phase starting SHA:** `9de005ae2dab73c3262c3ca556f06f191ec7fa65`

## Gates (baseline, before this phase's changes)

- `npm run typecheck` — 1 pre-existing failure: `react-router-dom` missing in
  unused `src/auth/AuthGuard.tsx`. Unchanged after this phase.
- `npm run lint` — 1 pre-existing error: unused `sortedPages` in the stray
  root-level duplicate `App.tsx`. Unchanged after this phase.
- `npm run test` — 126/126 passing.
- `npm run build` — succeeds.

## Gates (after this phase)

- `npm run typecheck` — same single pre-existing failure, no new ones.
- `npm run lint` — same single pre-existing error + warning, no new ones.
- `npm run test` — 126/126 passing (includes updated `grid.test.ts`, 34 tests
  across the two `grid.test.ts` copies, no assertion changes needed — see
  below).
- `npm run build` — succeeds.

## What changed

- Added the `ts-meta` / `ts-body` / `ts-tile` / `ts-head` / `ts-panel` scale
  to `tailwind.config.js` under `theme.extend.fontSize`, exactly as specified.
- Every `text-xs|text-sm|text-base|text-lg|text-xl|text-2xl` in `src/` (49
  hits) is now a `ts-` size, plus every arbitrary-value `text-[...]` font size
  found by a broader sweep (`text-3xl`, `text-4xl`, `text-[1.375rem]`,
  `text-[.9375rem]`, `text-[.8125rem]`, `text-[1.1875rem]`, `text-[.75rem]`,
  `text-[10px]`, `text-[1.0625rem]`) — decision 2 says font size in `src/`
  comes from the named scale, and these arbitrary values are font sizes too,
  so they're in scope even though the grep in §5 doesn't catch them by name.
- `TileCard.tsx`: every `clamp()` removed. Chip is a fixed 40px square,
  `rounded-[10px]`, `ts-body` weight 700. Title is `ts-tile`, `line-clamp-2`/
  `line-clamp-3` from the existing `titleLines` prop (both literal strings
  still present, unaffected by Tailwind's purge). Count is `ts-meta`,
  `mt-auto`, left-aligned. Card padding is `14px 16px`.
- `src/utils/grid.ts`: `maxTitleLines` constants updated per the spec's
  arithmetic — `TITLE_ROW_PADDING_PX` 30→28, `CHIP_AND_COUNT_PX`
  61→68.9 (40 + 10 + 18.9), `TITLE_LINE_HEIGHT_PX` 20→22.1.
  `COMPACT_BREAKPOINT_PX` left at 600 (see note below). The invariants
  (result always 2 or 3, never decreases as viewport grows) still hold —
  verified by simulation before touching the file and confirmed by the test
  run. No test assertions needed to change: both directional tests
  (`maxTitleLines(4, 900) === 3`, `maxTitleLines(5, 640) === 2`) still hold
  with the new constants, so the file is otherwise unchanged.

## Sanity-check values (as requested in §5)

| Viewport | rows | `maxTitleLines` |
|---|---|---|
| 1440×900 | 4 | 3 |
| 1440×900 | 5 | 2 |
| 1512×982 | 4 | 3 |
| 1512×982 | 5 | 2 |

## Adjustments beyond a straight size swap, and why

1. **Breakpoint discrepancy, left unchanged.** §3 refers twice to keeping
   "the existing `[@media(max-height:560px)]:hidden` behaviour" and "the
   smoothing... at the 560px breakpoint." The actual code (`TileCard.tsx`
   and `grid.ts`, cross-referenced by comment) uses 600px, and no "560"
   appears anywhere else in the repo or in the prior follow-up-fixes spec.
   Changing it wasn't implied by this phase's stated cause (font size as a
   viewport-dependent variable), so I left `COMPACT_BREAKPOINT_PX` at 600 and
   flagged this for you to confirm — if 560 was actually intended, that's a
   one-line follow-up in both files plus the comment tying them together.
2. **Two brand/document titles lose their largest-in-app size.**
   `LoginPage.tsx`'s "TileSpace" (`text-4xl`, 36px) and `DocumentEditor.tsx`'s
   note title (`text-3xl`, 36px, both the read-mode `<h1>` and the edit-mode
   input) mapped to `ts-panel` (24px), the largest size the new scale offers.
   Both shrink materially. Nothing in §2's category list covers a "biggest
   text in the app" case, so I used the ceiling of the scale rather than
   inventing a new size, per decision 5 (no new abstraction).
3. **`PasteLinkModal.tsx` modal titles unified.** "Saved!" was `text-xl`
   (20px), "Add Link" / "Choose Tile" was `text-lg` (18px). Both are now
   `ts-head` (22px) — I treated them as the same semantic role (a modal
   title) rather than preserving their previous size difference.
4. **`TilePanel.tsx` title input**: `text-[1.375rem]` (22px) → `ts-panel`
   (24px), per §2's explicit "the tile panel's title input → `ts-panel`".
5. **`PanelEmojiPicker.tsx` emoji grid** (`text-xl`, 20px) → `ts-head`
   (22px). These are emoji glyphs, not semantic text, so I picked the
   closest available size rather than a category from §2's text-purpose
   list.
6. **`TileSubmenu.tsx`** (the floating tile-picker menu) monogram + title
   were both `text-xs` (12px) in a dense `min-w-[220px]` two-column grid;
   both are now `ts-body` (16px) as "list rows" per §2. This is the largest
   relative jump in the sweep (+4px in a tight layout). Both spans already
   have `truncate`/`shrink-0`, so nothing overflows, but it's worth a look
   on a real screen since it's the one spot most likely to feel cramped.
7. **`TileCard.tsx` drag-over badge** (`text-[10px]`) → `ts-meta` (14px),
   the smallest size on the scale — still 4px larger than before, no smaller
   option exists.
8. **`src/index.css` markdown prose headings** (`.prose h1/h2/h3`, used by
   `DocumentEditor`'s rendered preview) mapped `text-2xl→ts-panel`,
   `text-xl→ts-head`, `text-lg→ts-tile` by visual hierarchy, since §2's
   category list doesn't address markdown content headings specifically.

No component needed a structural change or a spacing rework to accommodate
the new sizes; §6's "would require restructuring" stop condition was never
hit.

## Diff

20 files changed (19 `src/` files + `tailwind.config.js`), 82 insertions,
86 deletions. No unrelated files in the diff.

## Commit

Single commit on `main`. Tree clean afterward.
