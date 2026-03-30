# TileSpace: States & Transitions

**Purpose:** Map every object, state, transition, and user action so we know what to test.
**Last updated:** February 3, 2026

---

## Objects

| Object | Table | Parent | Max per parent |
|--------|-------|--------|----------------|
| Page | `pages` | User | 16 |
| Tile | `tiles` | Page | 25 |
| Link | `links` | Tile | unlimited |
| Note/Document | `links` (type='document') | Tile | unlimited |

---

## 1. App (Authentication & Loading)

### States

| State | What user sees |
|-------|---------------|
| Not authenticated | Login screen (Google OAuth button) |
| Authenticated, loading | Spinner / blank while pages + tiles load |
| Authenticated, loaded | Tile grid with page navigation |
| Error | Error message (e.g., "Failed to load pages") |

### Transitions

| # | From | Action | To | Verified | Unit Test | E2E Test |
|---|------|--------|----|----------|-----------|----------|
| A1 | Not authenticated | Click Google login | Authenticated, loading | [ ] | N/A | [ ] |
| A2 | Authenticated, loading | Pages + tiles fetched | Authenticated, loaded | [ ] | N/A | [ ] |
| A3 | Authenticated, loading | Fetch fails | Error | [ ] | N/A | [ ] |
| A4 | Authenticated, loaded | Log out | Not authenticated | [ ] | N/A | [ ] |

---

## 2. Pages

### States

| State | What user sees |
|-------|---------------|
| Empty page | Page exists, no tiles — shows empty grid |
| Active page | Page with 1-25 tiles displayed in grid |
| Full page | 25 tiles — "Add Tile" button hidden |

### Properties

| Property | Editable | How |
|----------|----------|-----|
| title | Yes | Overview mode: click title → inline edit |
| position | Yes | Overview mode: drag to swap with another page |
| palette_id | Yes | FloatingActions palette picker |

### Transitions

| # | From | Action | To | Verified | Unit Test | E2E Test |
|---|------|--------|----|----------|-----------|----------|
| P1 | Any page | Swipe left / press → | Next page | [ ] | N/A | [ ] |
| P2 | Any page | Swipe right / press ← | Previous page | [ ] | N/A | [ ] |
| P3 | Any page | Click page dot | Go to that page | [ ] | N/A | [ ] |
| P4 | Any page | Press 'O' or click dots area | Overview mode opens | [ ] | N/A | [ ] |
| P5 | Overview mode | Click page card background | Navigate to page, close overview | [ ] | N/A | [ ] |
| P6 | Overview mode | Click page title | Edit title inline | [ ] | N/A | [ ] |
| P7 | Overview mode | Drag page A onto page B | Swap positions | [ ] | N/A | [ ] |
| P8 | Overview mode | Right-click / three-dot menu → Rename | Edit title inline | [ ] | N/A | [ ] |
| P9 | Overview mode | Right-click / three-dot menu → Reset | Confirm → delete all tiles on page | [ ] | N/A | [ ] |
| P10 | Overview mode | Press Escape / click backdrop | Close overview | [ ] | N/A | [ ] |
| P11 | Any page | Change palette | All new tiles use new palette colors | [ ] | N/A | [ ] |

### Edge cases

- First page: swipe right does nothing (already at start)
- Last page: swipe left does nothing (already at end)
- Page title max length: 75 characters
- All 16 pages always exist — pages cannot be created or deleted, only reset

---

## 3. Tiles

### States

| State | What user sees |
|-------|---------------|
| Default / empty | Tile with "New Tile" title, default emoji, no links |
| Named | Tile with custom title, possibly custom emoji/color |
| Has links | Tile showing item count badge |
| Selected (panel open) | TilePanel open on right side showing tile details |
| Dragging | Tile at 50% opacity, scaled down |
| Drag target | Another tile being dragged over this one — amber glow |

### Properties

| Property | Editable | How |
|----------|----------|-----|
| title | Yes | TilePanel: click/type in title input |
| emoji | Yes | TilePanel: click emoji → emoji picker |
| accent_color | Yes | TilePanel: click color swatch → color picker |
| position | Yes | Main grid: drag tile to swap or move |

### Transitions

| # | From | Action | To | Verified | Unit Test | E2E Test |
|---|------|--------|----|----------|-----------|----------|
| T1 | Grid | Click "New Tile" (FloatingActions) | New tile created, panel opens, title focused + selected | [ ] | N/A | [ ] |
| T2 | Grid | Click existing tile | Panel opens for that tile | [ ] | N/A | [ ] |
| T3 | Panel open | Press Escape | Panel closes (title saved if changed) | [ ] | N/A | [ ] |
| T4 | Panel open | Click backdrop (dark overlay) | Panel closes | [ ] | N/A | [ ] |
| T5 | Panel open | Click X button | Panel closes | [ ] | N/A | [ ] |
| T6 | Panel open | Type new title → blur or Enter | Title saved to database | [ ] | N/A | [ ] |
| T7 | Panel open | Click emoji → pick new emoji | Emoji updated | [ ] | N/A | [ ] |
| T8 | Panel open | Click color swatch → pick new color | Color updated | [ ] | N/A | [ ] |
| T9 | Panel open | Click "Delete Tile" | Confirm → tile reset to empty defaults | [ ] | N/A | [ ] |
| T10 | Panel open (tile has links) | Click "Delete Tile" | Double confirm → tile + all links deleted | [ ] | N/A | [ ] |
| T11 | Grid | Drag tile A onto tile B | Positions swap (both tiles move) | [ ] | [ ] | [ ] |
| T12 | Grid | Drag tile to empty slot | Tile moves to that position | [ ] | [ ] | [ ] |

### Grid layout rules

| Tile count | Grid size | Capacity |
|------------|-----------|----------|
| 0-15 | 4×4 | 16 slots |
| 16-19 | 5×4 | 20 slots |
| 20-25 | 5×5 | 25 slots |

### Edge cases

- New tile on non-home page: requires page_id in unique constraint (was a bug, now fixed)
- Max 25 tiles per page — "Add Tile" button disappears at limit
- "Delete Tile" on tile with links: double confirmation
- "Delete Tile" on empty tile: single confirmation

---

## 4. Links (type='link')

### States

| State | What user sees |
|-------|---------------|
| Temp (unsaved) | Input fields in panel, not yet saved |
| Saved | Link row in panel with title, URL, edit/delete actions |
| Editing | Inline edit mode for title, URL, summary |

### Properties

| Property | Editable | How |
|----------|----------|-----|
| title | Yes | Panel: inline edit |
| url | Yes | Panel: inline edit |
| summary | Yes | Panel: inline edit |
| position | Yes | Panel: drag to reorder within tile |
| tile_id | Yes | Drag link from panel onto different tile card |

### Transitions

| # | From | Action | To | Verified | Unit Test | E2E Test |
|---|------|--------|----|----------|-----------|----------|
| L1 | Panel | Click "Add Link" | Temp link fields appear | [ ] | N/A | [ ] |
| L2 | Temp link | Type URL + title → blur | Link saved to database | [ ] | [x] | [ ] |
| L3 | Temp link | Click remove (X) | Temp link removed (no DB call) | [ ] | N/A | [ ] |
| L4 | Saved link | Click URL/external link icon | Opens URL in new tab | [ ] | N/A | [ ] |
| L5 | Saved link | Edit title/URL/summary → blur | Link updated in database | [ ] | N/A | [ ] |
| L6 | Saved link | Click delete | Link deleted from database | [ ] | N/A | [ ] |
| L7 | Saved link | Drag link onto different tile card | Link moves to target tile | [ ] | N/A | [ ] |

### Edge cases

- URL normalization: adds https:// if missing, lowercases domain
- Duplicate URL detection within same tile
- Link with empty title: uses domain as title

---

## 5. Notes/Documents (type='document')

### States

| State | What user sees |
|-------|---------------|
| Saved | Document row in tile panel |
| Editing | Full-screen markdown editor overlay |

### Properties

| Property | Editable | How |
|----------|----------|-----|
| title | Yes | Document editor |
| content | Yes | Document editor (markdown) |

### Transitions

| # | From | Action | To | Verified | Unit Test | E2E Test |
|---|------|--------|----|----------|-----------|----------|
| D1 | Panel / FloatingActions | Click "Add Note" | New document created, editor opens | [ ] | N/A | [ ] |
| D2 | Panel | Click document row | Document editor opens | [ ] | N/A | [ ] |
| D3 | Document editor | Edit content → save | Content saved to database | [ ] | N/A | [ ] |
| D4 | Document editor | Close editor | Returns to tile panel / grid | [ ] | N/A | [ ] |
| D5 | Panel | Delete document link | Document deleted | [ ] | N/A | [ ] |

---

## 6. Paste Link (Quick Add)

### Transitions

| # | From | Action | To | Verified | Unit Test | E2E Test |
|---|------|--------|----|----------|-----------|----------|
| Q1 | Grid | Click "Paste Link" (FloatingActions) | Paste dialog opens | [ ] | N/A | [ ] |
| Q2 | Paste dialog | Paste URL → submit | Link created on appropriate tile | [ ] | [ ] | [ ] |
| Q3 | Paste dialog | Cancel / Escape | Dialog closes | [ ] | N/A | [ ] |

---

## 7. Overview Mode

### States

| State | What user sees |
|-------|---------------|
| Viewing | 4×4 grid of all 16 page cards |
| Dragging page | One card at 50% opacity, target has amber glow |
| Editing title | Inline input on page card |
| Context menu open | Right-click menu with Rename / Reset |
| Reset confirm | Modal asking to confirm page reset |

### Transitions

(Covered in Pages section: P4-P10)

---

## 8. Existing Unit Test Coverage

| File | Tests | What's covered |
|------|-------|----------------|
| url.test.ts | 14 | isValidUrl, normalizeUrl, extractDomain |
| color.test.ts | 7 | isLightColor, getButtonStyles |
| grid.test.ts | 15 | getGridCapacity, getGridConfig, findFirstEmptyPosition |
| TileService.test.ts | 17 | getNextTilePosition, getDefaultEmoji, buildTilePositionMap |
| LinkService.test.ts | 26 | validateAndNormalizeUrl, checkDuplicateUrl, getNextLinkPosition |
| **Total** | **79** | Pure utility + service functions |

### What's NOT covered

- Any database calls (db.ts)
- Any React components
- Any user interactions (no E2E tests)
- Page swap logic
- Tile drag/drop swap logic
- Document create/edit/save flow
- Palette change flow
- Authentication flow

---

## 9. Testing Priority

Based on risk and frequency of use:

### High priority (test first)
1. **T1** — Create new tile (recently had position constraint bug)
2. **T11/T12** — Tile drag and swap (complex position logic)
3. **L2** — Create link with URL normalization (service already tested, needs E2E)
4. **P7** — Page swap in overview (position swap logic)
5. **T6** — Edit tile title (auto-focus regression was recent)

### Medium priority
6. **L7** — Move link between tiles (cross-tile operation)
7. **T9/T10** — Delete tile (confirm dialogs, cascade delete)
8. **P1/P2** — Page navigation (swipe + keyboard)
9. **D1-D4** — Document CRUD

### Low priority (stable, rarely touched)
10. **P11** — Palette change
11. **Q1-Q3** — Paste link dialog
12. **A1-A4** — Auth flow (handled by Supabase)
