# TileSpace Product Specification

## Overview

TileSpace is a personal knowledge management tool for quickly capturing and organizing links and notes into visual tiles. It prioritizes speed of capture (via keyboard shortcut) and visual organization over complex features.

## Core Concepts

### Tiles
- A tile is a container for related links and notes
- Each tile has: title, emoji icon, accent color, and position on the grid
- Tiles are displayed on a fixed grid (4x4, 5x4, or 5x5 depending on count)
- Maximum 25 tiles
- Users arrange tiles by drag-and-drop; positions are sacred and persist

### Links
- A link is a URL with title and optional summary
- Links belong to exactly one tile
- Links can be dragged between tiles

### Notes (Documents)
- A note is markdown content with title and optional summary
- Notes belong to exactly one tile
- Notes are edited in a full-screen editor with live preview

### Inbox
- Special tile named "Inbox" for quick capture
- Created automatically when first link is captured via keyboard shortcut
- Functions like any other tile otherwise

## Grid Behavior

### Capacity Tiers
- 1-16 tiles → 16 slots (4x4 grid)
- 17-20 tiles → 20 slots (5x4 grid)
- 21-25 tiles → 25 slots (5x5 grid)

### Position Rules
- Positions are integers 0 to (capacity - 1)
- Each tile occupies exactly one position
- Empty positions render as empty slots (user's layout is intentional)
- When creating a new tile: find first empty position within current capacity
- When deleting a tile: leave the gap (do NOT compact)
- Grid only expands when tile count exceeds current capacity

## User Actions

### Create Tile
- Click + menu → "Add New Tile"
- Creates tile at first empty position
- Opens tile panel for editing
- Default title: "New Tile"
- Emoji and color assigned based on position

### Edit Tile
- Click tile to open side panel
- Edit title (auto-saves on blur)
- Change emoji (picker)
- Change color (palette picker)
- View/manage links and notes

### Delete Tile
- Click "Delete Tile" button in panel
- Single confirmation for empty tiles
- Double confirmation for tiles with links/notes
- Leaves gap in grid (intentional)

### Move Tile
- Drag tile to empty slot → moves to that position
- Drag tile onto another tile → swaps positions

### Add Link (via UI)
- In tile panel: click "Add Link"
- Enter URL and optional title
- Saves on blur or Enter

### Add Link (via keyboard shortcut)
- Press Cmd+K (or configured shortcut) from any browser tab
- Captures current page URL and title
- Saves to Inbox tile (creates Inbox if needed)
- Shows brief confirmation

### Add Note
- In tile panel: click "Add Note"
- Opens full-screen markdown editor
- Auto-saves after 1 second of inactivity
- Empty notes are deleted on close

### Move Link
- Drag link from panel onto a tile in the grid
- Link moves to target tile

### Delete Link/Note
- Click trash icon on link row
- Single confirmation

### Change Palette
- Click palette button in bottom-left
- Select from available palettes
- All tiles recolor to new palette

## Visual Design

### Palettes
Each palette defines:
- Background color (page background)
- Border color (tile borders)
- 12 accent colors (tile backgrounds, buttons)

Categories: Vibrant, Muted

### Tile Card
- Rounded rectangle with thick colored border
- Emoji in colored circle
- Title below
- Item count at bottom
- Hover: slight lift effect
- Dragging: reduced opacity

### Tile Panel
- Slides in from right
- Draggable via handle at top
- Shows emoji (editable), color picker, title
- Lists all links/notes
- Action buttons at bottom

### Document Editor
- Full-screen overlay
- Edit/Read toggle
- Title, summary, content fields
- Markdown preview
- Auto-save indicator

## Technical Architecture (Target)

### Layer Separation

```
┌─────────────────────────────────────────┐
│           UI Components                  │
│  (TileCard, TilePanel, DocumentEditor)  │
│  - Receive props, emit events            │
│  - No business logic                     │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           State Management               │
│  (React Context or Zustand)             │
│  - Single source of truth               │
│  - Actions dispatch to services          │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           Services                       │
│  (TileService, LinkService)             │
│  - Business logic lives here            │
│  - Validation, position calculation      │
└─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────┐
│           API Layer                      │
│  (SupabaseClient wrapper)               │
│  - Raw database operations              │
│  - No business logic                     │
└─────────────────────────────────────────┘
```

### State Shape

```typescript
interface AppState {
  tiles: Tile[];
  selectedTileId: string | null;
  editingDocumentId: string | null;
  currentPaletteId: string;
  ui: {
    loading: boolean;
    error: string | null;
    showPasteLinkModal: boolean;
  };
}

interface Tile {
  id: string;
  title: string;
  emoji: string;
  accentColor: string;
  colorIndex: number;
  position: number;
  links: Link[];
  createdAt: string;
  updatedAt: string;
}

interface Link {
  id: string;
  tileId: string;
  type: 'link' | 'document';
  title: string;
  url: string | null;
  summary: string;
  content: string;
  position: number;
  createdAt: string;
}
```

### Service Interfaces

```typescript
interface TileService {
  getAll(): Promise<Tile[]>;
  create(paletteId: string): Promise<Tile>;
  update(id: string, updates: Partial<Tile>): Promise<Tile>;
  delete(id: string): Promise<void>;
  move(id: string, toPosition: number): Promise<void>;
  swap(idA: string, idB: string): Promise<void>;
  findFirstEmptyPosition(tiles: Tile[]): number;
}

interface LinkService {
  create(tileId: string, data: CreateLinkData): Promise<Link>;
  update(id: string, updates: Partial<Link>): Promise<Link>;
  delete(id: string): Promise<void>;
  move(id: string, toTileId: string): Promise<Link>;
}
```

## Database Schema (Existing - Keep As-Is)

### tiles
- id: uuid (PK)
- title: text
- emoji: text
- accent_color: text
- color_index: integer
- position: integer (unique)
- created_at: timestamptz
- updated_at: timestamptz

### links
- id: uuid (PK)
- tile_id: uuid (FK → tiles)
- type: text ('link' | 'document')
- title: text
- url: text (nullable)
- summary: text
- content: text
- position: integer
- created_at: timestamptz

### user_preferences
- id: integer (PK, always 1 for single user)
- current_palette: text
- updated_at: timestamptz

## Edge Function (Existing - Keep As-Is)

### quick-capture
- POST endpoint for Chrome extension
- Receives: { url, title }
- Creates Inbox tile if needed
- Adds link to Inbox
- Returns: { success: true }

## Chrome Extension (Existing - Keep As-Is)

- Keyboard shortcut (Cmd+K) triggers capture
- Sends current tab URL/title to edge function
- Shows brief notification on success

## Out of Scope (Future)

- User authentication (currently single-user, public RLS)
- Multiple users / sharing
- Search
- Tags
- Nested tiles
- Import/export
- Mobile app

## UI Preservation (Critical)

**The visual design and UX must not change.** The rebuild is a plumbing refactor only.

All styling is done via Tailwind CSS classes inline in component files. There is no separate CSS file.

### Files That Define the UI (preserve exactly):

1. **Component markup and Tailwind classes**
   - `src/components/TileCard.tsx` — tile appearance, hover states, drag styling
   - `src/components/TilePanel.tsx` — side panel layout, link rows, buttons, color picker
   - `src/components/DocumentEditor.tsx` — full-screen editor, edit/read toggle
   - `src/components/FloatingActions.tsx` — bottom-left menu, button styles
   - `src/components/PasteLinkModal.tsx` — modal layout, tile selection grid
   - `src/components/PaletteSelector.tsx` — palette picker dropdown
   - `src/components/EmojiPicker.tsx` — emoji selection UI

2. **Design tokens and utilities**
   - `src/types.ts` — PALETTES object, color definitions, grid calculations
   - `src/lib/constants.ts` — `getButtonStyles()`, `isLightColor()`

### Refactoring Rules:

- **DO** change: props interface, event handler wiring, imports
- **DO NOT** change: JSX structure, Tailwind classes, visual layout
- **DO NOT** change: animations, transitions, hover states, colors
- **TEST** visually: every component should look identical before/after

### Recommended Approach:

1. Copy all component files to new project unchanged
2. Create new state management layer
3. Create new service layer  
4. Wire components to new layers
5. Verify pixel-perfect match with current app

## Success Criteria

The rebuild is complete when:
1. All current functionality works
2. Code has clear layer separation
3. Adding a feature requires changing ≤2 files
4. State management is predictable (no stale closures)
5. TypeScript has no `any` types
6. Basic error handling shows user-visible feedback
