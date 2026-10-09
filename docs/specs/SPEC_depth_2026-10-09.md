# SPEC: a little more depth (option B) and the Clear palette, app-wide

Written: 2026-10-09 14:30 PT. Version 2: adds the Clear palette (Part 2). Supersedes version 1. Checked against SPEC_CHECKLIST.md rules 1-14.
Roles: planner Claude (chat), executor Claude Code. Unattended, about 45 min.
Targets: `docs/targets/TARGET_depth.html` (option B only) and
`docs/targets/TARGET_palette.html` (Clear only). Starting point: 5f4faf8, pushed.

## Decisions you will SEE

1. The window backdrop (behind the sidebar) becomes a warm grey with a very
   gentle top-to-bottom shade: #F3F0EA to #E9E5DD.
2. The content area becomes a raised rounded panel: radius 16px, 8px inset
   from the top, right and bottom edges, a faint white-to-#F8F7F3 shade,
   a thin border and a soft shadow, as option B.
3. Coloured tiles (pages and Master View) get a light edge on top and a
   slightly deeper soft shadow. Inputs like the Ask box look gently inset.
4. Applies on every screen: pages, Master View, document reader, settings.
   Login and loading screens keep a plain backdrop.
5. The eight swatch colours become the "Clear" palette, one family in the
   same key, in this rainbow order: Red #D8625C, Orange #EB883B,
   Gold #CF9B00, Green #47A34E, Teal #00A7A8, Blue #3690E3,
   Indigo #7C7FE5, Plum #BE67B7. Used for sidebar dots, Master View theme
   tiles, and the page dot on document cards.
6. Text on Gold and Orange fills is dark (#1C1917); white on the rest.
7. A document card's page dot now matches that page's sidebar dot.
8. Nothing else changes: layout, sizes, text, behaviour. Tile colours
   inside pages (the palettes) are unchanged.

## What the planner checked

- Repo zip tilespace_source_2026-10-08_211209.
- Tokens live in `tailwind.config.js` (`surface.page #FAFAF8`, `boxShadow.card`,
  `cardHi`, `borderRadius.tile 11px`). The shell is `src/components/AppShell.tsx`:
  root `bg-surface-page` (line 46), content column (line 72), content
  padding wrapper (line 87).
- Design rules: `~/.claude/skills/design-language/SKILL.md`. Mobile:
  sidebar is a drawer; on mobile the panel insets 8px on all sides.

## Work, Part 1: depth

Tier: fast. Wall time: 20 min.

1. Add tokens, do not hard-code: `surface.backdrop` (the gradient as a
   `backgroundImage` utility), `surface.panel`, `boxShadow.panel`,
   `boxShadow.tileLift`, `boxShadow.inset`, `borderRadius.panel 16px`.
2. AppShell: root uses the backdrop; the content column is wrapped in the
   panel (inset per Decision 2). The sidebar keeps its own background
   transparent over the backdrop; remove its right border if the panel's
   edge makes it redundant.
3. Tiles and Master View theme tiles use `tileLift`; the Ask box and other
   text inputs use `inset`. One place each, no per-screen overrides.
4. Update the design-language skill's token list so the next app can reuse
   these names (`~/.claude/skills/design-language/SKILL.md`, a short
   "Depth" section). If that path is not writable from here, write the
   section into `docs/DESIGN_DEPTH.md` and say so.

## Work, Part 2: the Clear palette

1. `src/lib/swatches.ts`: replace the eight colours with Decision 5's, in
   that order. Sidebar dots keep going round by position.
2. `swatchTextColor()`: dark on Gold and Orange, white on the rest.
3. Document card page dot (`pageSwatch` in `src/api/masterView.ts` /
   `DocCard`) uses the same position-based function as the sidebar, so the
   two always match (Decision 7). Remove the palette `swatch` field if
   nothing uses it any more.
4. Master View themes: the Edge Function's swatch list
   (`supabase/functions/master-view/logic.ts`, `assignDistinctSwatches`)
   uses the same eight; map each existing theme's old colour to a new one
   in one pass so themes stay distinct; redeploy the function.
5. Update the design-language skill's swatch list the same way as the
   depth tokens.


Vitest: AppShell renders the panel wrapper; tokens exist; the eight
Clear colours in order; dark text on Gold and Orange; card dot equals
sidebar dot for the same page; function test that 6 themes stay distinct. Screenshots of
a page, Master View, and the document reader at 1440 wide and 390 wide,
compared to the target's option B. `npm run test:all` once.

## Out of scope

Everything else. Page tile palettes. If something looks wrong, list it, do not change it.

## Report (never "done")

HEAD before/after, PROVEN/UNVERIFIED, screenshot paths. Committed, not pushed.
