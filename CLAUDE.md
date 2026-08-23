# TileSpace - Developer Guide

## Architecture

### Directory Structure
```
src/
├── api/          # Supabase API calls (pages, tiles, links, preferences)
├── auth/         # Authentication context and guards
├── components/   # React components (UI only)
├── hooks/        # Custom React hooks
├── lib/          # Constants and configuration
├── pages/        # Page-level components
├── services/     # Pure business logic (no React, no DB)
├── state/        # Zustand stores (pageStore, tileStore, uiStore)
├── types/        # TypeScript type definitions
└── utils/        # Pure utility functions
```

### State Management
- **Zustand** stores in `src/state/`
  - `pageStore.ts` - Pages, currentPageId, page CRUD
  - `tileStore.ts` - Tiles for current page, tile/link CRUD
  - `uiStore.ts` - UI state (selectedTileId, modals, transitions)
- Optimistic updates with error rollback

### Key Files
- `App.tsx` - Thin root component, wires stores to UI (~260 lines)
- `api/` - All Supabase database operations (pages.ts, tiles.ts, links.ts)
- `state/` - Zustand stores with all business logic
- `lib/constants.ts` - Magic numbers and configuration
- `types/` - All TypeScript interfaces

### Database
- Supabase PostgreSQL
- Tables: pages, tiles, links
- RLS policies enforce user isolation

### Testing
```bash
npm run build  # Type check + build
npm run test   # Run vitest
npm run dev    # Local development
```

### Deployment
```bash
git push       # Triggers Vercel deploy
vercel --prod  # Manual production deploy
```

## Layered Architecture

```
Components (UI only, no logic)
    ↓
Hooks (useTileGrid, useTileHandlers, etc.)
    ↓
State (Zustand stores - pageStore, tileStore, uiStore)
    ↓
Services (pure functions, no React, no DB)
    ↓
API Layer (all Supabase calls - api/pages.ts, api/tiles.ts, api/links.ts)
    ↓
Database (Supabase PostgreSQL)
```

### Rules
- **Components**: Render only. No business logic. No direct DB calls.
- **Hooks**: Bridge between stores and components. Extract complex logic.
- **State**: Zustand stores. Call API layer. Manage optimistic updates.
- **Services**: Pure functions. No React imports. No database imports. Testable.
- **API Layer**: ONLY place that imports Supabase client.

## Component Architecture

### Main Components

#### App.tsx (~260 lines)
Thin root component that wires Zustand stores to UI:
- Reads state from pageStore, tileStore, uiStore
- Delegates to custom hooks for complex logic
- No direct API calls or business logic

#### TilePanel/ (~400 lines total)
Modular tile editing panel:
- `TilePanel.tsx` - Main panel (~188 lines)
- `PanelLinkItem.tsx` - Link editing
- `PanelTempLinkItem.tsx` - Temporary link creation
- `PanelEmojiPicker.tsx` - Emoji selection
- `PanelColorPicker.tsx` - Color selection
- `index.tsx` - Barrel export

#### Other Key Components
- `AppShell.tsx` - Sidebar + header/board/footer layout skeleton
- `Sidebar/Sidebar.tsx` - Collapsible page list, replaces the old overview modal
- `Sidebar/PageRow.tsx` - One page row: swatch, title, drag-reorder, rename, reset
- `FloatingActions.tsx` - Floating action buttons
- `PageDots.tsx` - Mobile-only page position indicator
- `TileCard.tsx` - Individual tile display
- `PasteLinkModal.tsx` - Link paste modal
- `DocumentEditor.tsx` - Markdown document editor

### Custom Hooks

#### src/hooks/
- `usePageNavigation.ts` - Page navigation logic (next/prev/go to page)
- `useKeyboardNavigation.ts` - Arrow key navigation
- `useIsMobile.ts` - Mobile breakpoint detection
- `useTileGrid.tsx` - Grid rendering, drag-and-drop logic
- `useTileHandlers.ts` - Paste link, add note, save document handlers

### State Layer

#### src/state/
- `pageStore.ts` - Page CRUD, navigation, palette management (~116 lines)
- `tileStore.ts` - Tile/link CRUD, palette changes, optimistic updates (~275 lines)
- `uiStore.ts` - Selected tile, modals, transitions (~50 lines)

### API Layer

#### src/api/
All Supabase operations:
- `client.ts` - Supabase client and getCurrentUserId
- `pages.ts` - Page CRUD, swap positions, reset
- `tiles.ts` - Tile CRUD, recolor, swap/move positions
- `links.ts` - Link CRUD, move between tiles
- `preferences.ts` - User preferences

### Services Layer

#### src/services/
Pure business logic (no React, no DB):
- `TileService.ts` - Tile position, emoji, inbox utilities
- `LinkService.ts` - URL validation, duplicate checking, link utilities
- `PageService.ts` - Page sorting, position, column calculations

### Utilities

#### src/lib/constants.ts
Configuration and magic numbers:
- `GRID_CONFIG` - Grid breakpoints, max tiles, colors per palette
- `PAGE_TITLE_OVERLAY` - Hover zone dimensions and fade timing
- `APP_CONFIG`, `INBOX_TILE`, `TIMING`, `WELCOME_BACK`

#### src/utils/
- `url.ts` - normalizeUrl, isValidUrl, extractDomain
- `color.ts` - darkenColor
- `grid.ts` - Grid capacity calculations

### TypeScript Types

#### src/types/
- `tile.ts` - Tile, TileInsert, TileUpdate, TileRow
- `link.ts` - Link, LinkInsert, LinkUpdate, LinkRow, LinkType
- `page.ts` - Page
- `palette.ts` - Palette, PALETTES, getPalette, getColorFromPalette
- `emoji.ts` - EMOJI_CATEGORIES, DEFAULT_EMOJIS
- `user.ts` - User, UserPreferences

## Code Organization Principles

### File Size Limits
- No file over 300 lines
- Target 150-200 lines per file
- Largest files: tileStore.ts (275), App.tsx (261)

### Path Aliases
- `@/` maps to `src/` (configured in vite.config.ts and tsconfig.app.json)
- All imports use `@/` prefix for consistency

### Import Organization
- Barrel exports in `components/index.ts`, `hooks/index.ts`, `state/index.ts`, `services/index.ts`
- `@/` path aliases throughout

## Development Workflow

### Making Changes
1. Always run `npm run build` after changes
2. Run `npm run test` to verify tests pass
3. Check no file exceeds 300 lines

### Adding New Features
1. **Database access** → Add to `src/api/`
2. **Business logic** → Add to `src/services/`
3. **State management** → Add to `src/state/`
4. **Reusable logic** → Create custom hook in `src/hooks/`
5. **UI components** → Add to `src/components/` with barrel export
6. **Configuration** → Add to `src/lib/constants.ts`

### Warning Signs (Fix Immediately)
- File over 250 lines → Split now
- Component importing database directly → Move to API layer
- Logic in component → Extract to service or hook
- Direct Supabase imports outside `api/` → Move to API layer

## Design
UI work follows the house design language at ~/.claude/skills/design-language/SKILL.md. Read it before changing any styling, colour, or layout.

Visual language established in the 2026-08-22 visual refresh. Reference
targets live in `docs/targets/` (`TARGET_page.html`, `TARGET_page_collapsed.html`,
`TARGET_page_mobile.html`, generated by `generate_targets.py`) — read them
when a value is ambiguous.

- **Tokens**: `surface.page` / `surface.card`, `edge` / `edge.soft` (plus
  `edge.hover`, `edge.tilehover`, `edge.placeholder` for hover/placeholder
  shades), `ink` / `ink.2` / `ink.muted` / `ink.faint` / `ink.grip`, and the
  `card` / `cardHi` shadows — all defined in `tailwind.config.js`. No literal
  hex outside `src/lib/chipColors.ts` (chip hues) and `src/types/palette.ts`
  (page palettes); everything else uses these classes.
- **Chip colour rule**: a tile's displayed colour comes from
  `chipColor(tile.color_index)` / `chipTint(tile.color_index)` in
  `src/lib/chipColors.ts` — never from the page palette or `tile.accent_color`
  directly. Palettes are muted/monochrome by design, so palette-driven chips
  would look identical on a white card.
- **Two-line clamp rule**: tile titles are `line-clamp-2`, never 3. A fixed
  grid row height means a third line gets sliced mid-glyph instead of
  ellipsing — this was a real v1 bug. `overflow-hidden` plus `min-h-0` on
  every flex ancestor keeps overflow impossible.
- **Anchoring rule**: the shell's header height, gutter and title size are
  constants (`LAYOUT` in `src/lib/constants.ts`), identical regardless of
  which page is open or whether the sidebar is collapsed. Switching pages
  must not move the title by a pixel.

## Security

- Row Level Security (RLS) enforced in Supabase
- User isolation at database level
- No secrets in frontend code
- Proper authentication guards on routes

## Backlog format (read by Tenzing)

`docs/backlog.yaml` is this project's record of work and is read by Tenzing.

- Items are entries under `items:` with `title`, `status` (`open` or `done`),
  optional `section` and `body`.
- When you ADD an item, omit `id`. Tenzing assigns one within the hour.
- When you EDIT an item, keep its `id` unchanged. Rewording is fine.
- When you COMPLETE an item, set `status: done`. Keep the entry.
- Never remove, reuse or renumber an `id`.
- Do not add priority, estimates or scheduling here. Those live in Tenzing.

# important-instruction-reminders
Do what has been asked; nothing more, nothing less.
NEVER create files unless they're absolutely necessary for achieving your goal.
ALWAYS prefer editing an existing file to creating a new one.
NEVER proactively create documentation files (*.md) or README files. Only create documentation files if explicitly requested by the User.
