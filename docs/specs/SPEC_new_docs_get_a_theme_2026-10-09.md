# SPEC: new documents get a theme straight away, and Nunito

Written: 2026-10-09 15:35 PT. Version 2: adds Nunito (Work 3). Supersedes version 1. Checked against SPEC_CHECKLIST.md rules 1-14.
Roles: planner Claude (chat), executor Claude Code. Unattended, about 25 min.
Starting point: 02f3f93 (depth + Clear palette).

## Decisions you will SEE

1. A newly added document appears on a theme tile the next time Master
   View opens, instead of staying invisible until 5 documents pile up.
2. If a document cannot be placed (model error, or no theme fits), it
   appears on a small slate tile named `Not sorted yet`, so nothing is ever
   hidden. That tile disappears when it is empty.
3. The whole app's text uses Nunito instead of the system font
   (San Francisco). Sizes and weights stay as they are.
4. The full re-sort still happens only when there are no themes or 5+
   documents changed since the last sort. Nothing else changes.

## What the planner checked

- Repo zip tilespace_source_2026-10-08_222235.
- Refresh runs only on opening Master View (`src/state/masterViewStore.ts:48`).
- `supabase/functions/master-view/refresh.ts`: changed docs found by
  `content_hash` (~line 186); `needsTheming = no themes || changedSinceTheming >= 5`
  (~line 210). Below 5, new docs keep `theme_id = null`.
- `src/services/MasterViewService.ts:33` skips any doc whose theme is
  null or unknown, so those docs show on no tile. Ask can still find them.
- Font: `index.html:13` loads Nunito (weights 600, 700, 800 only), but
  nothing applies it; `tailwind.config.js` has no `fontFamily`, so text
  falls back to the system font.
- The function was not redeployed after the last round (Clear colours).

## Work

1. In `refresh.ts`, when `needsTheming` is false: for each non-hidden
   insight with `theme_id` null, one small model call through the existing
   `_shared/aiClient.ts`: existing theme names + the doc's summary, answer
   must be exactly one of the names (JSON). Valid answer: set `theme_id`.
   Anything else: leave null. Batch all such docs into one call when there
   are several (return a name per link id).
2. `MasterViewService`: collect docs with null or unknown theme into a
   synthetic group `Not sorted yet` (slate swatch, sorted last, opens like
   any theme). Keep using the existing tile sizing.
3. Nunito: in `index.html` load weights 400;500;600;700;800. In
   `tailwind.config.js` set `fontFamily.sans` to
   `['Nunito', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif']`.
   Check the document reader and inputs inherit it. Nunito runs a little
   wider than San Francisco: check the sidebar names and theme tiles still
   wrap cleanly, and list anything that now overflows (do not redesign).
   Add a one-line note to the design-language skill that TileSpace uses
   Nunito.
4. Redeploy: `supabase functions deploy master-view` (this also ships last
   round's Clear colours). Ashish approved this deploy for this round.

## Gates (red first)

Function test with a stubbed model: 2 new docs, 4 themes, no re-theme,
both get valid theme ids; a bad answer leaves null. Vitest: body font family starts with Nunito. A null-theme
doc lands on `Not sorted yet`; the tile is absent when empty. Live: call
`refresh` once after deploy, paste the JSON result and the theme colours.

## Out of scope

Everything else. Document reader styling stays as is.

## Report (never "done")

HEAD before/after, PROVEN/UNVERIFIED, live refresh result, deploy output, one screenshot of Master View in
Nunito (taken with a throwaway Playwright browser, never Ashish's Chrome).
`npm run test:all` once. Committed, not pushed.
