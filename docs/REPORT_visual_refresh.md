# REPORT — TileSpace visual refresh

Executed per `docs/specs/SPEC_visual_refresh_2026-08-22.md`, four phases, one
session, committed to `main`.

**Starting SHA:** `6e49ac0313a6c20c0d6779f05870f35be1bc2487`
**Starting tree:** clean except the spec file and `docs/targets/` themselves
(untracked, expected — they were the inputs to this run). No stop condition.

## Commits

| Phase | SHA | Message |
|---|---|---|
| 0 — foundation | `1aeed7bb4a4b8cb4b40a49a56086148499b360ec` | `refactor(design): add neutral tokens, layout constants, chip palette` |
| 1 — shell | `f1f6c3d6a433e1ed34ff67e13097978bf7cf20ab` | `feat(ui): replace overview modal with collapsible page sidebar` |
| 2 — tiles | `317c003050a17ee3102b2797bdde11ca61b560d3` | `feat(ui): restyle tiles to neutral cards with per-tile chip colour` |
| 3 — cleanup | `f1e11e4df25b1cd9c22c055f83ebe789f5b398ad` | `feat(ui): complete visual refresh across panels, modals and menus` |

Working tree is clean at HEAD (`f1e11e4`).

## Gate results (all four phases)

`npm run typecheck && npm run lint && npm run test && npm run build` — green
at every phase, modulo two **pre-existing, unrelated** failures present at
the starting SHA (proven via `git stash` back to `6e49ac0` before any work
began, which reproduced the identical errors):

- `src/auth/AuthGuard.tsx` imports `react-router-dom`, which is not a
  dependency of this project and is not in `node_modules`. `AuthGuard` is
  dead code — not imported by `App.tsx`, `main.tsx`, or anything reachable
  from the app's entry point (confirmed: `vite build` succeeds because the
  module is never bundled; only `tsc`, which type-checks the whole
  `tsconfig.app.json` include set regardless of reachability, sees it).
- A stray, git-tracked `App.tsx` at the **repository root** (not
  `src/App.tsx`) fails lint with an unused-var error. This is a pre-existing
  duplicate/orphan file unrelated to `src/App.tsx`; I did not touch it.

Neither failure is in this spec's scope, both predate this work, and both
were left as-is per the master protocol's "clearly unrelated pre-existing
failure — prove it, report it, don't silently waive it."

Final test count: 117 passing (up from 115 at the start — `chipColors.test.ts`,
`Sidebar.test.tsx`, and `TileCard.test.tsx` added; `color.test.ts`'s 7 tests
removed because their subject, `src/utils/color.ts`, was deleted — see
Deviations). No previously-passing test assertion was weakened.

## Deviations from the spec, with reasons

1. **No `@testing-library/react` in the project.** The spec's Phase 1/2 test
   files are described as "(jsdom, @testing-library)", but only
   `@testing-library/jest-dom` (matchers) is a dependency — `@testing-library/react`
   itself is not installed, and §1.12 forbids new dependencies. `Sidebar.test.tsx`
   and `TileCard.test.tsx` render and interact with components using plain
   `react-dom/client` + `react-dom/test-utils` (`act`) instead, which are
   already part of the installed `react-dom`. Added
   `IS_REACT_ACT_ENVIRONMENT = true` to `src/test/setup.ts` to silence React's
   act-environment warning under this setup.

2. **Tile counts in the sidebar required a new query.** The spec's `PageRow`
   must show a tile count per page (matching the target), but nothing in the
   existing data model tracked tile counts outside the currently-loaded page.
   Per §1's fallback rule ("take the option that changes the least"), I added
   one small read-only query, `api.fetchTileCounts()` (`select page_id` from
   `tiles`, reduced to counts client-side — no schema change, no migration),
   loaded alongside `loadPages()` and kept live via a new `bumpTileCount`
   action called from `tileStore`'s `createTile`/`deleteTile`/and
   `pageStore`'s `resetPage`. This is additive and read-only; it does not
   touch `tiles.accent_color`/`color_index`, which item 8 protects.

3. **`FloatingActions` and `PageDots` kept their fixed/floating positioning.**
   The target HTML shows the add/palette controls as normal-flow content
   inside `<footer>`. Phase 2's spec text, though, says explicitly:
   *"FloatingActions keeps all of its behavior; only its container styling
   changes to ... pills."* Restructuring the hover-driven multi-item menu
   (Add Tile / Add Link / Add Note / `TileSubmenu`) out of fixed positioning
   into in-flow footer content risked behavior regressions for no behavior
   requested by the text. I restyled the trigger button and dropdown
   container to the new pill/card tokens (§3) and left positioning
   unchanged. `AppShell`'s `<footer>` region exists and reserves
   `LAYOUT.FOOTER_HEIGHT_PX`, but is otherwise empty — this matches how the
   pre-refresh app already tolerated fixed controls overlapping the bottom of
   the grid. Flagging this because it's the one place where the *visual*
   match to `TARGET_page.html`'s footer layout is the loosest in the whole
   refresh.

4. **`UserMenu` genuinely moved**, per the spec's explicit instruction
   ("moved here from its fixed position"). It's no longer `fixed`; it now
   renders inline in `Sidebar`'s foot row, with a `who` (email) label added
   to match the target (the original component had no such label — it only
   showed the avatar). Dropdown/sign-out behavior is unchanged.

5. **`src/utils/color.ts` deleted entirely, not just `getButtonStyles`.**
   The spec named `getButtonStyles`, `isLightColor`, and `getComplementaryColor`
   as candidates ("check before deleting"). I checked: after `TilePanel`'s
   buttons were rewritten to flat, chip-colour-based inline styles (replacing
   `getButtonStyles`), `isLightColor` had no remaining caller (its only use
   was inside `getButtonStyles`), and `getComplementaryColor` and
   `darkenColor` already had zero callers anywhere in `src/` before this
   phase. Deleted the whole file, its barrel export, and its test file
   (`src/test/color.test.ts` — nothing left in `color.ts` to test).

6. **New design tokens beyond §3's list.** The target's CSS defines a few
   more literal hex values used only in hover/placeholder states:
   `#DAD8D2` (control hover border), `#DEDCD6` (tile hover border), `#D8D6D0`
   (new-page placeholder swatch). To satisfy the Phase 3 cleanup grep ("no
   literal hex in `src/components/`... nowhere else") without approximating
   these with a nearby existing token, I added them to `tailwind.config.js`
   as `edge.hover`, `edge.tilehover`, `edge.placeholder`, plus `ink.grip`
   (`#B9B7B0`, the sidebar row's drag-grip color). All four are exactly the
   target's own values.

7. **Sidebar wordmark gradient** (`linear-gradient(135deg, #7C3AED, #2563EB)`
   in the target) is built from `chipColor(1)` and `chipColor(0)` rather than
   inlined as hex — those two values are already exactly the first two chip
   colors, so this is the same visual result sourced from the one place chip
   hexes are allowed to live.

## Decisions not covered by §1

- **Mobile swipe-handler placement.** Previously `useSwipeable`'s handlers
  were spread on the full-screen fixed root. With the header now in-flow
  (not an overlay), I moved them onto the board/grid container instead of
  threading them through `AppShell`. The board still covers the large
  majority of the mobile viewport, so swipe-to-navigate is unaffected in
  practice; only the header's small strip is no longer a swipe target.
- **PageDots' unused `onShowOverview`/`onCreatePage` props** were already
  present in its interface but never destructured/used in the component body
  even before this refresh. Removed them when updating the call site rather
  than carrying dead props forward.

## Behavior not preserved

None identified. Every existing interaction named in §1.14 (tile
drag/swap/insert, shift-to-swap, link paste, document editor, palette
change, keyboard arrows, swipe, tile panel) was exercised via the existing
test suite plus manual code-path review, and all handlers were carried over
verbatim per component (only their surrounding JSX/classNames changed).

## Not verified

There is no browser/visual test tooling in this repo (per §9, out of scope
to add), so the actual rendered look — chip colors, sidebar collapse
animation, mobile drawer, spacing against `docs/targets/*.html` — has not
been visually confirmed by a human. Everything mechanical (grep gates, file
sizes, typecheck/lint/test/build) is green; the visual review is Ashish's,
per the spec's own "Definition of done."
