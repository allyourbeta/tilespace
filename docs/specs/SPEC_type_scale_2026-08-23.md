# SPEC — TileSpace type scale

**Spec version:** 1.0
**Written:** 2026-08-23 01:04 PT
**Follows:** `SPEC_followup_fixes_2026-08-23.md`, which ended at `d861ec8`.
**Executor:** one agentic Claude Code session, one phase, one commit.

Two problems, one cause. Text across the app is a point too small, and tile
titles are truncated where a third line would fit.

The cause is that font size is currently a *variable the layout is allowed to
spend*. `TileCard` sizes its text with `clamp()` against viewport height, so
adding rows shrinks the type; the rest of the app uses whatever Tailwind
literal each component happened to pick. This phase makes font size fixed and
lets layout adapt around it.

---

## 0. Decisions already made — do not ask

1. Font size never varies with viewport. Every `clamp()` on a font-size,
   width, height or padding in `TileCard.tsx` is deleted.
2. There is one named scale. Every text size in `src/` comes from it.
3. Tile titles may reach **three** lines. Two is the floor on short windows,
   three the ceiling — never four.
4. The item count stays pinned to the bottom-left of the card.
5. This is a single-user personal app. Do not add abstraction, theming layers,
   user-configurable sizing, or accessibility scaffolding beyond what is
   written here.
6. Work on `main`. One commit.

---

## 1. Starting state

```bash
git rev-parse HEAD    # expect d861ec8 or later; record it
git status            # must be clean
npm ci
```

Gates: `npm run typecheck && npm run lint && npm run test && npm run build`.
Two failures pre-date this work (orphaned `react-router-dom` import in unused
`AuthGuard.tsx`; stray duplicate `App.tsx` at the repo root). They stay. Any
*new* failure is yours.

---

## 2. The scale

Add to `tailwind.config.js` under `theme.extend.fontSize`. These are the only
text sizes in the app.

```js
fontSize: {
  'ts-meta':   ['0.875rem', { lineHeight: '1.35' }],  // 14px — counts, stamps, captions
  'ts-body':   ['1rem',     { lineHeight: '1.45' }],  // 16px — sidebar rows, link rows, buttons
  'ts-tile':   ['1.0625rem',{ lineHeight: '1.3'  }],  // 17px — tile titles
  'ts-head':   ['1.375rem', { lineHeight: '1.25' }],  // 22px — page heading
  'ts-panel':  ['1.5rem',   { lineHeight: '1.25' }],  // 24px — tile panel title
},
```

Chip monogram is `ts-body` at weight 700.

Roughly +1 to +2px on everything currently shipped. Apply it **everywhere**,
not only the tiles: sidebar rows, page heading, footer controls, tile panel,
link rows, modals, menus, login page.

Mechanically: `grep -rn "text-xs\|text-sm\|text-base\|text-lg\|text-xl\|text-2xl" src/`
returns 56 hits today. Every one is replaced by a `ts-` size. Map them by what
the text *is*, not by a size table:

- captions, counts, timestamps, helper text → `ts-meta`
- ordinary interface text, list rows, buttons, inputs → `ts-body`
- tile titles → `ts-tile`
- the page heading → `ts-head`
- the tile panel's title input → `ts-panel`

---

## 3. TileCard

Delete every `clamp()` in `TileCard.tsx`. Replace with fixed values:

- chip: `40px` square, `rounded-[10px]`, monogram `ts-body` weight 700
- gap below chip: `10px`
- title: `ts-tile`, weight 600, `line-clamp-2` or `line-clamp-3` from the
  existing `titleLines` prop
- count: `ts-meta`, `mt-auto`, left-aligned, `ink-muted`, rendered only when
  the tile has links
- card padding: `14px 16px`

Keep the existing `[@media(max-height:560px)]:hidden` behaviour on the chip and
count — that is the genuine short-window escape valve and it stays.

### maxTitleLines

`maxTitleLines(rows, viewportHeight)` in `src/utils/grid.ts` already exists,
works, and is tested. **Keep it.** Only its constants change, because the
elements it measures have changed size:

- title line box: `17 × 1.3 = 22.1px` (was 20)
- chip: 40px (was 34)
- chip margin: 10px (unchanged)
- count reserve: `14 × 1.35 = 18.9px` (was 17)
- vertical padding: `14 × 2 = 28px` (was 30)

Keep the smoothing the previous session added at the 560px breakpoint — it
exists because the naive arithmetic broke monotonicity, and that fix is still
needed.

Update the existing tests in `src/test/grid.test.ts` to the new constants.
The invariants do not change and must still hold: the result is always 2 or 3,
and it never decreases as the viewport grows. Keep the full sweep test.

**Expected outcome, so you can sanity-check your own arithmetic**: on a large
external monitor at the 30-tile capacity the function returns 3. On a 13-inch
MacBook Air at the same capacity it returns 2 — that is correct behaviour, not
a failure. Two lines of 17px beats three lines of clipped 15px.

---

## 4. Everything else

Walk every component under `src/components/` plus `src/App.tsx` and convert its
text sizes. Nothing else about those components changes — no spacing rework, no
restyling, no layout changes. If raising a size makes something obviously
collide or overflow, adjust that one spot's padding minimally and note it in
the report.

Two spots need a second look because they are size-sensitive:

- **Sidebar rows** at `ts-body` are taller. With 20 pages the list scrolls;
  that is fine and already supported. Do not shrink the rows to avoid it.
- **The collapsed sidebar rail** holds swatches only, so it is unaffected.

---

## 5. Definition of done

- [ ] One commit on `main`, tree clean.
- [ ] Four gates green, no new failures.
- [ ] `grep -rn "text-xs\|text-sm\|text-base\|text-lg\|text-xl\|text-2xl" src/` → empty.
- [ ] `grep -rn "clamp(" src/components/` → empty.
- [ ] Both `line-clamp-2` and `line-clamp-3` still appear as literal strings in
      `TileCard.tsx` (interpolated class names get purged by Tailwind and
      silently produce no clamp at all).
- [ ] `grid.test.ts` passes with the new constants, including the monotonicity
      sweep.
- [ ] No file over 300 lines.
- [ ] `docs/REPORT_type_scale.md`: starting SHA, the commit SHA, anything you
      adjusted beyond a size swap and why, and the values
      `maxTitleLines` returns at 1440×900 and at 1512×982 for 4 and 5 rows.

## 6. Stop and report if

- The tree is not clean at the start.
- A gate cannot go green without weakening a test.
- Converting a size would require restructuring a component rather than
  adjusting padding.
