# TileSpace - Developer Guide

## Architecture

### Directory Structure
```
src/
├── api/          # Supabase API calls (unused - consider removing)
├── auth/         # Authentication context and guards
├── components/   # React components
├── hooks/        # Custom React hooks
├── lib/          # Core utilities (db.ts, constants.ts, supabase.ts)
├── pages/        # Page-level components
├── types/        # TypeScript type definitions
└── utils/        # Pure utility functions
```

### State Management
- Uses React useState in App.tsx (not Zustand)
- Tiles and pages loaded from Supabase
- Optimistic updates with error rollback

### Key Files
- `App.tsx` - Main app component, all state lives here
- `lib/db.ts` - All Supabase database operations
- `lib/constants.ts` - Magic numbers and configuration
- `types/` - All TypeScript interfaces

### Database
- Supabase PostgreSQL
- Tables: pages, tiles, links
- RLS policies enforce user isolation

### Testing
```bash
npm run build  # Type check + build
npm run dev    # Local development
```

### Deployment
```bash
git push       # Triggers Vercel deploy
vercel --prod  # Manual production deploy
```

## Component Architecture

### Main Components

#### App.tsx (640 lines)
The root component that manages all application state:
- Page and tile state management
- Authentication handling
- Navigation and routing logic
- Uses custom hooks for page navigation and keyboard handling

#### TilePanel/ (403 lines total)
Modular tile editing panel split into separate files:
- `TilePanel/TilePanel.tsx` - Main panel component
- `TilePanel/PanelLinkItem.tsx` - Link editing component
- `TilePanel/PanelTempLinkItem.tsx` - Temporary link creation
- `TilePanel/index.tsx` - Barrel export

#### Other Key Components
- `PageTitleDisplay.tsx` - Page title overlay with hover/transition logic
- `PageDots.tsx` - Navigation dots with overview mode disc
- `OverviewMode.tsx` - Grid view of all pages
- `TileCard.tsx` - Individual tile display component

### Custom Hooks

#### src/hooks/
- `usePageNavigation.ts` - Page navigation logic (next/prev/go to page)
- `useKeyboardNavigation.ts` - Arrow key navigation handling
- `index.ts` - Barrel exports for hooks

### Database Layer

#### src/lib/db.ts
All database operations are centralized here:
- Page CRUD operations
- Tile CRUD operations  
- Link CRUD operations
- Position swapping and reordering
- Uses constants from `constants.ts`

### Utilities

#### src/lib/constants.ts
Configuration and magic numbers:
- `GRID_CONFIG` - Grid breakpoints, max tiles, colors per palette
- `PAGE_TITLE_OVERLAY` - Hover zone dimensions and fade timing
- `OVERVIEW_MODE` - Grid layout configuration
- Color utility functions for contrast

#### src/utils/url.ts
URL handling utilities:
- `normalizeUrl()` - Adds https:// and validates URLs
- `isValidUrl()` - Validates HTTP/HTTPS URLs
- `extractDomain()` - Gets clean domain from URL

### TypeScript Types

#### src/types/
- Core interfaces for Tile, Link, Page
- Palette and color definitions
- Grid configuration types

## Code Organization Principles

### File Size Limits
- No file over 300 lines (current status: ✅)
- TilePanel split from 657 → 403 lines
- App.tsx reduced from 674 → 640 lines

### Separation of Concerns
- **Components**: UI rendering only
- **Hooks**: Reusable logic extraction
- **Database**: Centralized in `lib/db.ts`
- **Utils**: Pure functions in `utils/`
- **Constants**: Centralized configuration

### Import Organization
- Barrel exports in `components/index.ts` and `hooks/index.ts`
- Consistent relative path imports
- Clear separation between internal and external dependencies

## Recent Refactoring (Completed)

### Phase 1: Dead Code Removal
- ✅ Removed unused Zustand store (`src/state/`)
- ✅ Removed unused StyleMockups component
- ✅ Removed old PageTitle component (replaced by PageTitleDisplay)
- ✅ Removed duplicate LinkItem and TempLinkItem components
- ✅ Removed unused AppPage.tsx

### Phase 2: Constants Extraction
- ✅ Moved magic numbers to `src/lib/constants.ts`
- ✅ Updated PageTitleDisplay to use constants
- ✅ Updated db.ts to use grid configuration constants

### Phase 3: Component Splitting
- ✅ Split TilePanel.tsx into modular structure
- ✅ Created dedicated TilePanel/ directory
- ✅ Extracted PanelLinkItem and PanelTempLinkItem

### Phase 4: Hook Extraction  
- ✅ Extracted usePageNavigation hook from App.tsx
- ✅ Extracted useKeyboardNavigation hook
- ✅ Reduced App.tsx complexity

### Phase 5: Utility Consolidation
- ✅ Consolidated URL utilities to `src/utils/url.ts`
- ✅ Removed duplicate functions from db.ts

### Phase 6: Barrel Exports
- ✅ Updated `src/components/index.ts` with all components
- ✅ Added proper exports for new hooks

## Development Workflow

### Making Changes
1. Always run `npm run build` after changes
2. Test core functionality: login, navigation, tile/link CRUD
3. Commit with descriptive messages following established patterns

### Adding New Features
1. **Database access** → Add to `src/lib/db.ts`
2. **Reusable logic** → Create custom hook in `src/hooks/`
3. **UI components** → Add to `src/components/` with barrel export
4. **Configuration** → Add to `src/lib/constants.ts`

### Code Quality Standards
- TypeScript strict mode enabled
- All magic numbers moved to constants
- Functions under 50 lines preferred
- Clear, descriptive naming
- Proper error handling with user-friendly messages

## Performance Considerations

- React hooks for state management (fast, simple)
- Optimistic updates for better UX
- Debounced search and input handling
- Lazy loading of components where appropriate
- Efficient re-renders through proper dependency arrays

## Security

- Row Level Security (RLS) enforced in Supabase
- User isolation at database level
- No secrets in frontend code
- Proper authentication guards on routes

This architecture provides a clean, maintainable foundation for TileSpace development. The modular structure makes it easy to extend functionality while keeping code organized and testable.