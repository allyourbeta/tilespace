# Spec: Deep Link to a Page via URL Hash (Phase 1)

Status: Backlog — not started
Written: 2026-07-24

## Goal

Opening `https://<app-domain>/#<page title>` lands directly on the page
with that title. Enables Alfred keyword shortcuts to specific TileSpace
pages.

Phase 2 (separate, manual): Chrome's per-app "open supported links in
this app" toggle so Alfred-opened URLs land in the installed PWA window
instead of a browser tab. Not part of this spec.

## Decisions already made (do not revisit)

- Match by page **title**, not page id. Ids are UUIDs and undiscoverable
  when authoring an Alfred shortcut. Accepted trade-off: renaming a page
  breaks its shortcut.
- Use the URL **hash fragment** (`#...`). No router library. No new
  dependency. Hash is invisible to the server, so no Vercel config
  changes.
- **Clear the hash** after landing (via `history.replaceState`), so the
  URL is purely an entry point and never shows a stale page name while
  navigating.
- Precedence on startup: **URL hash > localStorage last page > first
  page by position**. The existing localStorage restore
  (`PAGE_PERSISTENCE.LAST_PAGE_KEY`, pageStore.ts) stays as the
  fallback.

## Behavior

1. On startup, if `window.location.hash` is non-empty:
   - Decode it (`decodeURIComponent`) — titles contain spaces.
   - Trim; match against loaded page titles, case-insensitive.
   - If exactly one match: set it as `currentPageId` and persist it via
     the existing `persistLastPage`.
   - Multiple matches (duplicate titles): use the lowest `position`.
   - No match: fall through to normal precedence. No error UI.
2. Clear the hash after resolution (match or not).
3. Hash is read once at startup only. No hashchange listener in this
   phase.
4. Welcome-back overview: when the app is opened via a hash link, skip
   the welcome-back overview for that launch. Rationale: an explicit
   deep link is a statement of intent; showing the overview on top
   defeats the shortcut. (Note: this differs from plain-refresh
   behavior, where the overview still shows.)

## Implementation notes

- All logic lives in `pageStore.ts` `loadPages()`, alongside the
  existing localStorage restore. No component changes expected.
- Add hash key handling near `PAGE_PERSISTENCE` in `lib/constants.ts`
  if any constant is needed.
- Title matching is pure logic → put `findPageByTitle(pages, rawHash)`
  in `services/PageService.ts` (pure, testable) and call it from the
  store.
- Keep pageStore.ts under 300 lines (currently 152).

## Tests (vitest, in src/test/PageService.test.ts)

- Match with URL-encoded spaces: `#Life%20Advice` → "Life Advice".
- Case-insensitive match.
- Duplicate titles → lowest position wins.
- No match → returns undefined.
- Empty/whitespace hash → returns undefined.

## Acceptance

- Opening `/#Life Advice` shows the Life Advice page; address bar shows
  the bare domain afterward.
- Opening with an unknown title behaves exactly like a normal launch.
- Plain refresh (no hash) still restores the last-viewed page.
- `npm run build` and `npm run test` pass; no file exceeds 300 lines.
