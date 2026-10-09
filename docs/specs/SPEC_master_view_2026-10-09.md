# SPEC: Master View (theme tiles + Ask), brighter colours, wider sidebar

Written: 2026-10-09 10:40 PT. Version 1. Checked against SPEC_CHECKLIST.md rules 1-14.
Roles: planner Claude (chat), executor Claude Code. Unattended, about 60-90 min.
Targets (approved): `docs/targets/TARGET_master_view.html` (section C only) and
`docs/targets/TARGET_sidebar_swatches.html` (sidebar + swatches only).

## Decisions you will SEE

1. Title bar (installed app) is blue #2563EB instead of #0891B2.
2. Sidebar swatches use the eight bright colours. Each of the 12 existing
   palettes maps to one: coral-reef red #E02718, ocean-bold blue #2563EB,
   sunset-glow orange #FF8A00, emerald deep teal #0F766E, berry-pop
   raspberry #DB2777, cobalt blue #2563EB, sage-clay deep teal #0F766E,
   dusty-rose raspberry #DB2777, ocean-mist slate #475569, sand-dune gold
   #F5C518, lavender violet #7C3AED, nordic slate #475569. Tile colours on
   the pages themselves do NOT change. Changing a page's palette changes
   its swatch, as now.
3. Sidebar is 40px wider (272px) and page names wrap to two lines instead
   of being cut off.
4. A "Master View" entry sits at the top of the sidebar (grid icon).
5. Master View screen, per target C: an Ask box at the top, then theme
   tiles. Each tile: colour, theme name, count, newest titles (5 on big
   tiles, 3 on small). Bigger themes get bigger tiles. Click a tile to see
   all its documents as cards; click a card to open it in the existing
   document reader. Each card has `Hide`; hidden ones collect under
   `N hidden. Show hidden` at the bottom, where they can be restored.
6. Ask box: type roughly what you remember, press Enter, up to 8 matching
   cards appear, each with one line on why it matched. Esc clears.
7. Themes are made automatically and refresh as documents change. First
   visit shows `Sorting your documents...` until the first pass finishes.

## What the planner checked

- Repo: zip tilespace_source_2026-10-08_184237.
- Documents are rows in `links` with `type='document'` and `content`
  (migration `20260108075653_add_document_support.sql`).
- Supabase is hosted; there is one Edge Function already
  (`supabase/functions/quick-capture/index.ts`, uses `SUPABASE_URL`,
  `SUPABASE_SERVICE_ROLE_KEY`). Same pattern for the new function.
- All DB calls go through `src/api/` (CLAUDE.md rule). Keep it.
- Sidebar swatch: `Sidebar/PageRow.tsx:32`
  `getPalette(page.palette_id).background`; names truncate at line 88.
  Palettes: `src/types/palette.ts` (12 ids).
- Title bar colour: `public/manifest.json:10` and `index.html:5`, both
  `#0891B2`.
- Tests: `npm test` (vitest), `npm run test:all` (build + vitest).
- Deploy: push to main triggers Vercel. Ashish pushes, not Claude Code.
- PWA lessons (dev-kit/pwa-icons/LESSONS.md): the installed title bar
  only updates once the live site has the change; never restart
  Dock/Finder/Terminal.

## AI choice, decided

DeepSeek, same key as Tenzing (`DEEPSEEK_API_KEY` in `~/.tenzing/env`).
DeepSeek has no embeddings API, so this uses no embeddings: at his scale
(tens to a few hundred documents) the model reads short summaries
directly. All model calls go through ONE module with an OpenAI-compatible
base URL + model name, so a local model (Ollama, LM Studio) can replace
DeepSeek later by changing config only.

## Step 0

Record HEAD and `git status --short`; commit a dirty tree as
`wip: before master view`. Read CLAUDE.md and the design-language skill.

## Part 1: colours and sidebar (Decisions 1-4)

Tier: fast. Wall time: 15 min.
1.1 `theme_color` and `<meta name="theme-color">` -> `#2563EB`.
1.2 Add `swatch` per palette per Decision 2 (in `palette.ts`); PageRow
    uses it. Tile rendering untouched.
1.3 Sidebar width 272px; page name `line-clamp-2`, no truncate; row aligns
    to the first line. Mobile drawer gets the same.
1.4 Master View sidebar entry above the page list (not a page row).
Gates: vitest for the swatch map (all 12) and that names are not
truncated; screenshot of the sidebar vs the target.

## Part 2: plumbing

Tier: integration with a stubbed model. Wall time: 30 min.
2.1 Migration: `doc_theme(id, name, swatch, sort, created_at)` and
    `doc_insight(link_id pk fk links on delete cascade, summary text,
    content_hash text, theme_id fk doc_theme, hidden bool default false,
    updated_at)`. RLS like `links` (owner only). Apply to the hosted
    project the way this repo already applies migrations; if that needs a
    login only Ashish has, stop after writing it and print the one command.
2.2 Edge Function `master-view`, actions:
    - `refresh`: for each document whose `content_hash` changed or is new,
      ask the model for a 25-word summary from title + first 3,000
      characters. Then, if there are no themes or 5+ documents changed
      since the last theming: send all summaries plus the existing theme
      names, ask for 5-10 short noun-phrase themes (reuse existing names
      where they still fit) and one theme per document, as JSON. Assign
      swatches from the eight, stable per theme name. Validate the JSON;
      on any model error keep the old themes and return the error.
    - `ask`: query + all summaries -> up to 8 link ids, each with a
      one-line reason, as JSON. Ignore ids not in the set.
    Secret `DEEPSEEK_API_KEY` set with `supabase secrets set` from
    `~/.tenzing/env`; if the CLI is not linked, print the command for
    Ashish and continue with the stub for tests.
2.3 Client: `src/api/masterView.ts` only. Master View calls `refresh` on
    open (incremental, returns fast when nothing changed), then reads
    themes + insights.

## Part 3: the screen (Decisions 5-7)

Tier: fast + one live pass. Live reason: real model, real documents.
Wall time: 25 min.
3.1 `MasterView.tsx` + `ThemeTile.tsx` + `DocCard.tsx`, styles in their
    own module per the design-language skill; tile size from count
    (largest 2x2, next 2x1, rest 1x1, as the target), so a later redesign
    touches only these files.
3.2 States: first run (`Sorting your documents...`), normal, one theme
    open, Ask results, Ask no match (`Nothing close. Try other words.`),
    model error (`Couldn't sort right now. Showing your documents
    unsorted.` plus a flat newest-first card grid), hidden list.
3.3 Live pass: run `refresh` against his real documents once. Paste the
    theme names and counts in the report, and one sample Ask.

Gates (red first): vitest for tile sizing, hide/restore, each state;
function test with a stubbed model for both actions and bad JSON.
Screenshot of the real screen with his real themes.

## Out of scope

Tenzing link (later). Local models. Voice in the Ask box.

## Stop conditions

Never touch the production database except through the migration and
the function. Do not stop to ask; anything needing his login is printed
as a command at the end.

## Report (never "done")

HEAD before/after. Theme names and counts from the live pass. PROVEN /
UNVERIFIED. Commands Ashish must run (secret, migration) if any.
`npm run test:all` once at the end. Committed, not pushed.
