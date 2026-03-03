# TileSpace: Hover Navigation & Reduced-Click UX

## Summary

Three phased improvements to reduce clicks throughout TileSpace:
1. **Hover Shelf** — hover the page dots bar to expand a page-browsing shelf; hover a page to navigate there. Zero-click page navigation.
2. **Single-Click Add Page** — a `+` card in the hover shelf creates a new page in one click.
3. **Streamlined Add Link** — Cmd+V auto-creates a link when a tile panel is open; floating menu "Add Link" goes directly to the current page's Inbox tile.

**Design principle:** Hover for navigation and viewing. Click for creation and deletion.

---

## Phase 1: Hover Shelf for Page Navigation

### Goal
Replace the current "click dots to navigate, click grid icon to see overview" pattern with a hover-activated shelf that rises from the page dots bar. The user can browse and navigate to any page with zero clicks.

### Current State
- `PageDots.tsx` renders a slim bar at bottom center: a grid-icon disc on the left + dots for each page.
- Clicking a dot navigates to that page.
- Clicking the disc opens the full-screen `OverviewMode` component.
- Desktop only (hidden on mobile; mobile uses swipe + a grid button in FloatingActions).

### New Behavior

#### Trigger: Hover the dots bar
- When the user hovers over the `PageDots` bar for **600ms**, a shelf expands upward from the bar.
- If the mouse leaves the bar AND the shelf before 600ms, nothing happens (timer cancels).
- Once the shelf is open, it stays open as long as the mouse is anywhere inside the shelf OR the bar (treat them as one hover zone).

#### The Shelf
- Appears directly above the dots bar, anchored to bottom center.
- Contains a horizontal row of page thumbnail cards.
- Each card shows:
  - The page's palette background color (fill the card with it).
  - The page title (white text, truncated).
  - A white ring/border if it's the current page.
- The shelf has a semi-transparent dark background (`bg-black/40 backdrop-blur`) with rounded corners.
- Animation: slides up + fades in over ~200ms. Slides down + fades out on close over ~150ms.
- The shelf does NOT replace the full-screen OverviewMode. That still exists for management (rename, reorder, reset). The shelf is for quick navigation only.

#### Navigate: Hover a page card
- When the user hovers over a page thumbnail for **400ms**, the app navigates to that page.
- The grid behind the shelf immediately updates to show the new page's tiles.
- The shelf stays open so the user can keep browsing.
- Visual feedback: on hover (before the 400ms fires), the card scales up slightly (`scale-105`) and gets a brighter border. This gives the user confidence something is about to happen.
- If the user moves off the card before 400ms, the timer cancels and nothing happens.

#### Close the shelf
- When the mouse leaves the combined shelf + bar area, the shelf closes after a **200ms** grace period (prevents flicker if the user briefly moves between cards).
- Pressing Escape also closes the shelf.

#### Interaction with existing dots
- The dots themselves remain visible inside the bar.
- Clicking a dot still works as instant navigation (no 400ms delay).
- The grid-icon disc remains. Clicking it still opens the full-screen OverviewMode for management tasks.

### Files to Create / Modify

**New file: `src/components/HoverShelf.tsx`** (~120-150 lines)
- Receives: `pages`, `currentPageId`, `onPageSelect`, `onShowOverview`
- Manages: shelf open/close state, hover timers, animation classes
- Renders: the shelf container + page thumbnail cards
- Positioned absolutely, anchored above the dots bar

**Modify: `src/components/PageDots.tsx`**
- Wrap the existing bar in a container div that includes the HoverShelf.
- Add `onMouseEnter` / `onMouseLeave` handlers to the container (bar + shelf = one hover zone).
- Pass a `isShelfOpen` state + `setShelfOpen` to control the shelf.
- The bar itself does NOT change visually. It just gains hover detection.

**No changes to:** `App.tsx`, `OverviewMode.tsx`, or any other file.

### Implementation Notes

- Use `useRef` for all timers. Clean up on unmount.
- The shelf and bar must be wrapped in a single parent div so `mouseLeave` only fires when leaving BOTH. Do not use separate hover zones.
- Use CSS `transition` for the slide/fade animation, not JS-driven animation.
- Page cards in the shelf should be ~100px wide × ~70px tall (adjust for taste, but keep them small — this is a quick-nav tool, not a full preview).
- Keep the shelf max-width reasonable. If there are many pages (e.g., 16), allow horizontal scrolling or wrap to 2 rows. For now, assume ≤8 pages and use a single row.

### Test Checklist

- [ ] Hovering over the dots bar for <600ms does NOT open the shelf
- [ ] Hovering over the dots bar for ≥600ms opens the shelf with a smooth animation
- [ ] The shelf shows one card per page, with correct background colors and titles
- [ ] The current page's card has a distinct visual indicator (white ring)
- [ ] Hovering a page card for <400ms does NOT navigate
- [ ] Hovering a page card for ≥400ms navigates to that page (grid updates behind the shelf)
- [ ] The shelf stays open while the mouse is inside it
- [ ] Moving the mouse away from the shelf+bar area closes it (with brief grace period)
- [ ] Pressing Escape closes the shelf
- [ ] Clicking a dot in the bar still navigates instantly
- [ ] Clicking the grid-icon disc still opens full-screen OverviewMode
- [ ] Mobile: no change. HoverShelf is desktop-only (check `useIsMobile`)
- [ ] No regressions: swipe navigation, keyboard arrows, page title display all still work
- [ ] Build passes: `npm run build`

---

## Phase 2: Single-Click "Add Page" in the Shelf

### Goal
Add a `+` card at the end of the page row inside the hover shelf. One click creates a new page and navigates to it.

### Prerequisites
- Phase 1 is complete and tested.
- A `createPage` function must be added to `db.ts` (it doesn't exist yet).

### Current State
There is no UI for creating new pages. Pages appear to be seeded in the database. This phase adds that ability.

### New Behavior

#### The `+` card
- Appears as the last item in the shelf's page row.
- Visual: dashed border, `+` icon centered, semi-transparent (`bg-white/10 border-white/30 border-dashed`).
- On hover: brightens slightly (`bg-white/20`).
- On click: creates a new page and navigates to it.

#### Create Page logic
- Determine the next position: `max(page.position for all pages) + 1`.
- Default title: `"Page N"` where N is the new position + 1 (e.g., "Page 5").
- Default palette: `'ocean'` (or copy the current page's palette — your choice, but state which).
- Insert into `pages` table via Supabase.
- After creation: add the new page to local state, navigate to it, close the shelf.

### Files to Create / Modify

**Modify: `src/lib/db.ts`**
- Add `createPage(title: string, position: number, paletteId: string): Promise<Page>`
- Insert into `pages` table with `user_id` from auth, return the created page.

**Modify: `src/components/HoverShelf.tsx`**
- Add the `+` card at the end of the page row.
- Accept a new prop: `onCreatePage: () => void`

**Modify: `src/components/PageDots.tsx`**
- Pass `onCreatePage` through to HoverShelf.

**Modify: `src/App.tsx`**
- Add `handleCreatePage` function:
  1. Calculate next position.
  2. Call `createPage()`.
  3. Add new page to `pages` state.
  4. Set `currentPageId` to the new page.
  5. Set `tiles` to `[]` (new page has no tiles).
- Pass `handleCreatePage` down to `PageDots`.

### Test Checklist

- [ ] The `+` card appears at the end of the shelf row
- [ ] Clicking `+` creates a new page in the database
- [ ] After creation, the app navigates to the new (empty) page
- [ ] The new page appears in the shelf on next hover
- [ ] The new page has a sensible default title ("Page N")
- [ ] The shelf closes after page creation
- [ ] The dots bar shows the new page's dot
- [ ] Hovering `+` does NOT accidentally create a page (hover = brighten only, not create)
- [ ] Build passes: `npm run build`

---

## Phase 3: Streamlined "Add Link"

### Goal
Reduce the number of steps to add a link from 5-6 clicks to 1-2.

### Current State
- **From floating menu:** Click `+` → Click "Add Link" → PasteLinkModal opens → type URL → click "Continue" → pick tile from grid → saved. (5-6 steps)
- **From tile panel:** Click "Add Link" → inline temp link appears → type URL → blur to save. (2-3 steps, already decent)

### New Behavior

#### 3A: Cmd+V auto-link when tile panel is open
- When a tile panel is open (a tile is selected), pressing **Cmd+V** (or Ctrl+V on Windows/Linux):
  1. Read the clipboard.
  2. If the clipboard contains a URL (starts with `http://` or `https://`):
     - Auto-create a link on the selected tile with that URL as both the URL and title.
     - Show a brief inline confirmation (e.g., a toast or the link appearing in the list).
     - The user can then edit the title if they want.
  3. If the clipboard does NOT contain a URL, do nothing (let the browser's native paste work in any focused input).

**Important edge case:** If an input field inside the tile panel has focus (e.g., the user is editing a link title), Cmd+V should do normal paste into that field, NOT trigger auto-link creation. Only trigger auto-link when no text input is focused.

#### 3B: Floating menu "Add Link" skips the modal
- When the user clicks `+` → "Add Link" from the floating menu:
  1. If the current page has an Inbox tile, create the link directly on the Inbox tile. Open the tile panel for Inbox so the user can see the new link and edit it.
  2. If there is no Inbox tile but there are tiles, open the PasteLinkModal as before (the user needs to pick a tile).
  3. If there are no tiles at all, create a new tile named "Inbox" first, then add the link to it.
- This replaces the current behavior where "Add Link" always opens the full PasteLinkModal.

**Note:** The PasteLinkModal is NOT deleted. It's still used when there's no Inbox tile and the user needs to pick a destination. But the common case (Inbox exists) now skips it entirely.

### Files to Modify

**Phase 3A — Cmd+V auto-link:**

**Modify: `src/components/TilePanel/TilePanel.tsx`**
- Add a `useEffect` that listens for the `paste` event on `window`.
- In the handler:
  - Check if `document.activeElement` is an input/textarea. If so, return (let normal paste happen).
  - Read clipboard text via `navigator.clipboard.readText()`.
  - If it looks like a URL, call `onCreateLink(tile.id, { title: url, url, summary: '' })`.
  - Show feedback (could flash the link list, or briefly show "Link added!" text).

**Phase 3B — Floating menu shortcut:**

**Modify: `src/App.tsx`**
- Change the `onPasteLink` handler passed to FloatingActions:
  - Check if current page has an Inbox tile.
  - If yes: read clipboard, create link on Inbox, open Inbox tile's panel.
  - If no Inbox: fall through to `setShowPasteLink(true)` (existing modal behavior).

**Modify: `src/components/FloatingActions.tsx`**
- No structural changes needed. The `onPasteLink` callback just does something smarter now.

### Test Checklist

**3A — Cmd+V:**
- [ ] With tile panel open and no input focused, Cmd+V with a URL in clipboard creates a link on the selected tile
- [ ] The new link appears in the tile panel's link list
- [ ] With an input focused inside the panel, Cmd+V pastes text normally (no auto-link)
- [ ] Cmd+V with non-URL clipboard content does nothing special
- [ ] Duplicate URL detection still works (existing check in `handleCreateLink`)

**3B — Floating menu:**
- [ ] If Inbox tile exists: "Add Link" reads clipboard, creates link on Inbox, opens Inbox panel
- [ ] If no Inbox tile: "Add Link" opens PasteLinkModal as before
- [ ] If clipboard doesn't contain a URL: opens PasteLinkModal as fallback
- [ ] If no tiles at all: creates Inbox tile first, then adds the link

**General:**
- [ ] No regressions in the existing PasteLinkModal flow
- [ ] No regressions in the tile panel's "Add Link" button (inline temp link)
- [ ] Build passes: `npm run build`

---

## Architecture Notes

### File size limits
- HoverShelf.tsx should be ≤150 lines. If it grows, extract the page card into a `ShelfPageCard.tsx` component.
- No existing file should grow past 300 lines from these changes.

### Mobile
- All hover-based features are desktop-only. Check `useIsMobile()` and skip hover logic on mobile.
- Mobile users continue to use swipe + the grid button in FloatingActions for navigation.
- Phase 3A (Cmd+V) is desktop-only in practice (mobile doesn't have Cmd+V), but the paste listener should still work if triggered.
- Phase 3B (floating menu shortcut) works on both mobile and desktop.

### State flow
- The hover shelf does NOT manage its own page state. It receives `pages` and `currentPageId` from App via PageDots, and calls `onPageSelect` to navigate. Same data flow as the existing dots.
- The `createPage` function follows the same pattern as `createTile`: insert to DB, return the created record, update local state in App.tsx.

### Timer cleanup
- Every `setTimeout` must be stored in a `useRef` and cleared on unmount AND on re-trigger.
- Pattern:
```typescript
const timerRef = useRef<number | null>(null);

const startTimer = () => {
  if (timerRef.current) clearTimeout(timerRef.current);
  timerRef.current = window.setTimeout(() => {
    // action
  }, DELAY_MS);
};

const cancelTimer = () => {
  if (timerRef.current) {
    clearTimeout(timerRef.current);
    timerRef.current = null;
  }
};

useEffect(() => {
  return () => cancelTimer();
}, []);
```

### Constants
Add to `src/lib/constants.ts`:
```typescript
export const HOVER_SHELF = {
  OPEN_DELAY_MS: 600,
  NAV_DELAY_MS: 400,
  CLOSE_GRACE_MS: 200,
  CARD_WIDTH_PX: 100,
  CARD_HEIGHT_PX: 70,
} as const;
```

---

## Execution Order

1. **Phase 1** → test everything on the checklist → commit
2. **Phase 2** → test everything on the checklist → commit
3. **Phase 3A** → test → commit
4. **Phase 3B** → test → commit

Each phase should be a clean, working state. Do not start the next phase until the current one builds and all checklist items pass.
