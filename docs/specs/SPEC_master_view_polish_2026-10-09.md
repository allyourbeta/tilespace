# SPEC: Master View polish (final round for now)

Written: 2026-10-09 11:45 PT. Version 1. Checked against SPEC_CHECKLIST.md rules 1-14.
Roles: planner Claude (chat), executor Claude Code. Unattended, about 30 min.
Starting point: c8cdf17 (Master View round), pushed.

## Decisions you will SEE

1. Title bar deep blue #1E40AF (was #2563EB).
2. Clicking "Master View" in the sidebar always opens the tile overview,
   never a previously open category or Ask result.
3. Sidebar dots go round the rainbow by list position, so no two
   neighbours share a colour: blue, violet, raspberry, red, orange, gold,
   deep teal, slate, then repeat. The dot no longer follows the page's
   palette; tile colours on pages are unchanged.
4. Each title on a theme tile is a link that opens that document directly.
   Clicking the theme name, count, or empty tile area opens the category.
   A tile shows all its titles while they fit (5 on 2x2, 3 otherwise);
   beyond that, the newest that fit plus `N more`, which opens the category.
5. Gold tiles use dark text (#1C1917) instead of white.
6. No two themes share a colour while there are 8 or fewer themes.

## What the planner checked

- Repo zip tilespace_source_2026-10-08_201612 and his screenshots of
  2026-10-09 (two gold and two orange tiles; white text on gold).
- Title bar: `public/manifest.json` theme_color, `index.html` meta.
- Sidebar entry: `Sidebar/Sidebar.tsx` ~line 131. Dot:
  `Sidebar/PageRow.tsx:32` `getPalette(page.palette_id).swatch`.
- Tile: `MasterView/ThemeTile.tsx`, whole tile is one button
  (`onClick`, line 23) with `text-white` (line 24).
- Theme colours: `supabase/functions/master-view/refresh.ts:113`
  `swatchForName(name)` (hash per name, so collisions happen).

## Work

Tier: fast, plus redeploy of the `master-view` function. No migration.

1. Theme colour (Decision 1) in both files.
2. Sidebar entry resets Master View state to the overview (Decision 2).
3. PageRow dot from position in the sidebar order (Decision 3); collapsed
   sidebar and mobile drawer use the same function. Remove the palette
   `swatch` field if nothing else uses it.
4. ThemeTile: the tile stops being one button. Theme header and empty
   area open the category; each title is its own button/link opening the
   document in the existing reader; keyboard focus works on each (Decision 4).
5. Text colour by swatch: dark on gold, white on the rest (Decision 5).
   Put the rule in one helper used by tiles and any other swatch fills.
6. Swatch assignment in `refresh.ts`: when themes are (re)made, give each
   a distinct colour from the 8 in a fixed order, keeping an existing
   theme's colour if it is still unique; only fall back to repeats past 8.
   Also run a one-off fix over his current 6 themes so duplicates go now.
   Redeploy the function (Decision 6).

## Gates (red first)

Vitest: rainbow dots for 18 pages (no equal neighbours), tile click
targets (title opens doc, header opens category), dark text on gold,
sidebar entry resets state. Function test: 6 themes get 6 distinct
colours. One live pass: his 6 themes have 6 colours (paste them).
Screenshot of the overview and the sidebar.

## Out of scope

Anything else. If something else looks wrong, list it in the report,
do not change it.

## Stop conditions

Never touch page/tile/link data. If a step needs his login, print the
command. Do not stop to ask.

## Report (never "done")

HEAD before/after, PROVEN/UNVERIFIED, theme colours after the fix,
`npm run test:all` once. Committed, not pushed.
