# TileSpace Refactoring Spec

## CRITICAL: Read This First

This is a **pure refactoring** task. The app currently works correctly. Your job is to improve code organization without changing any functionality.

**Rules:**
- NO behavior changes
- NO "improvements" to business logic  
- NO new features
- Test `npm run build` after EVERY change
- Commit after EACH refactor with a descriptive message
- If unsure about something, leave it alone

---

## Phase 1: Identify and Delete Dead Code

Before deleting ANY file, verify it's not imported anywhere:
```bash
grep -r "filename" src/ --include="*.ts" --include="*.tsx"
```

### 1.1 Check if store.ts is used
```bash
grep -r "useAppStore\|from.*store" src/ --include="*.ts" --include="*.tsx"
```
If NO imports found (other than in store.ts itself), delete:
- `src/state/store.ts`
- `src/state/hooks.ts` (if it only re-exports store)
- `src/state/index.ts` (if empty after above)

**Commit:** `refactor: remove unused Zustand store`

### 1.2 Check if StyleMockups.tsx is used
```bash
grep -r "StyleMockups" src/ --include="*.ts" --include="*.tsx"
```
If NO imports found, delete `src/components/StyleMockups.tsx`

**Commit:** `refactor: remove unused StyleMockups component`

### 1.3 Check if PageTitle.tsx is used (not PageTitleDisplay.tsx)
```bash
grep -r "from.*PageTitle['\"]" src/ --include="*.ts" --include="*.tsx"
```
If NO imports (PageTitleDisplay is the current one), delete `src/components/PageTitle.tsx`

**Commit:** `refactor: remove old PageTitle component`

### 1.4 Check duplicate LinkItem
Compare:
- `src/components/LinkItem.tsx`
- The `LinkItem` function inside `src/components/TilePanel.tsx`

If the standalone one isn't imported anywhere:
```bash
grep -r "from.*LinkItem" src/ --include="*.ts" --include="*.tsx"
```
Delete the unused one.

**Commit:** `refactor: remove duplicate LinkItem`

### 1.5 Check TempLinkItem.tsx
```bash
grep -r "from.*TempLinkItem" src/ --include="*.ts" --include="*.tsx"
```
If not imported (there's one inside TilePanel.tsx), delete standalone file.

**Commit:** `refactor: remove duplicate TempLinkItem`

### 1.6 Check AppPage.tsx vs App.tsx
```bash
grep -r "AppPage" src/ --include="*.ts" --include="*.tsx"
```
Determine which is the real entry point. If AppPage.tsx is unused, delete it.

**Commit:** `refactor: remove unused AppPage`

---

## Phase 2: Extract Constants

All magic numbers should move to `src/lib/constants.ts`.

### 2.1 Add new constants
Add to `src/lib/constants.ts`:
```typescript
// Grid configuration
export const GRID_CONFIG = {
  BREAKPOINTS: [16, 20, 25] as const,
  MAX_TILES: 25,
  COLORS_PER_PALETTE: 12,
  TEMP_POSITION: -1, // Used for position swapping
} as const;

// Page title overlay
export const PAGE_TITLE_OVERLAY = {
  HOVER_ZONE_WIDTH_PX: 300,
  HOVER_ZONE_HEIGHT_PX: 160,
  FADE_TIMEOUT_MS: 2000,
} as const;

// Overview mode
export const OVERVIEW_MODE = {
  GRID_COLUMNS: 4,
} as const;
```

### 2.2 Update db.ts
Replace hardcoded values with constants:
- `>= 25` → `>= GRID_CONFIG.MAX_TILES`
- `count < 16 ? 16 : count < 20 ? 20 : 25` → use GRID_CONFIG.BREAKPOINTS
- `position % 12` → `position % GRID_CONFIG.COLORS_PER_PALETTE`
- `tempPosition = -1` → `GRID_CONFIG.TEMP_POSITION`

### 2.3 Update PageTitleDisplay.tsx
Replace:
- `w-[300px]` → Use constant (or leave as Tailwind, note in comment)
- `h-[160px]` → Use constant (or leave as Tailwind, note in comment)  
- `2000` (timeout) → `PAGE_TITLE_OVERLAY.FADE_TIMEOUT_MS`

### 2.4 Update OverviewMode.tsx
Add comment referencing constant for grid-cols-4.

**Commit:** `refactor: extract magic numbers to constants`

---

## Phase 3: Split TilePanel.tsx (657 lines → ~300 lines)

This is the riskiest refactor. Go slow.

### 3.1 Create TilePanel directory
```
src/components/TilePanel/
├── index.tsx        (re-export)
├── TilePanel.tsx    (main component)
├── PanelLinkItem.tsx    (extracted from TilePanel)
├── PanelTempLinkItem.tsx (extracted from TilePanel)
```

### 3.2 Extract PanelLinkItem
1. Copy the `LinkItem` function from TilePanel.tsx to new file
2. Add all necessary imports
3. Export the component
4. Import it back into TilePanel.tsx
5. Test: `npm run build`

### 3.3 Extract PanelTempLinkItem  
1. Copy the `TempLinkItem` function from TilePanel.tsx to new file
2. Add all necessary imports
3. Export the component
4. Import it back into TilePanel.tsx
5. Test: `npm run build`

### 3.4 Create index.tsx
```typescript
export { TilePanel } from './TilePanel';
```

### 3.5 Update imports in App.tsx
Change:
```typescript
import { TilePanel } from './components/TilePanel';
```
To:
```typescript
import { TilePanel } from './components/TilePanel';
```
(Should work the same due to index.tsx)

**Test thoroughly** — TilePanel is heavily used.

**Commit:** `refactor: split TilePanel into separate component files`

---

## Phase 4: Extract Hooks from App.tsx (674 lines)

Create custom hooks to reduce App.tsx size.

### 4.1 Create hooks directory
```
src/hooks/
├── index.ts
├── usePageNavigation.ts
├── useKeyboardNavigation.ts
```

### 4.2 Extract usePageNavigation
Move from App.tsx:
- `goToNextPage`
- `goToPrevPage`  
- `goToPage`
- Related state: `sortedPages`, `currentPageIndex`

```typescript
// src/hooks/usePageNavigation.ts
export function usePageNavigation(pages: Page[], currentPageId: string | null) {
  // ... extracted logic
  return {
    sortedPages,
    currentPageIndex,
    goToNextPage,
    goToPrevPage,
    goToPage,
  };
}
```

### 4.3 Extract useKeyboardNavigation
Move the keyboard event listener useEffect to its own hook:
```typescript
// src/hooks/useKeyboardNavigation.ts
export function useKeyboardNavigation(onLeft: () => void, onRight: () => void) {
  useEffect(() => {
    // ... extracted logic
  }, [onLeft, onRight]);
}
```

### 4.4 Update App.tsx
Import and use the new hooks. Verify behavior is identical.

**Commit:** `refactor: extract navigation hooks from App.tsx`

---

## Phase 5: Consolidate URL Utilities

### 5.1 Check for duplicate normalizeUrl
- `src/lib/db.ts` has `normalizeUrl` and `isValidUrl`
- `src/utils/url.ts` may have similar functions

### 5.2 Consolidate
Move all URL utilities to `src/utils/url.ts`. Update imports in db.ts.

**Commit:** `refactor: consolidate URL utilities`

---

## Phase 6: Clean Up Barrel Exports

### 6.1 Update src/components/index.ts
Add any missing component exports. Remove any dead exports.

### 6.2 Update src/hooks/index.ts
Export the new hooks.

**Commit:** `refactor: update barrel exports`

---

## Phase 7: Create CLAUDE.md

Create `CLAUDE.md` in project root documenting:

```markdown
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
```

**Commit:** `docs: add CLAUDE.md architecture guide`

---

## Final Verification

After all refactors:

1. `npm run build` — Must pass
2. `npm run dev` — Test manually:
   - Login works
   - Page navigation works (swipe, dots, arrows)
   - Tile CRUD works
   - Link CRUD works  
   - Overview mode works
   - Page title shows on hover and page switch
3. All features work exactly as before

**Final commit:** `refactor: complete code cleanup`

---

## Summary of Expected Commits

1. `refactor: remove unused Zustand store`
2. `refactor: remove unused StyleMockups component`
3. `refactor: remove old PageTitle component`
4. `refactor: remove duplicate LinkItem`
5. `refactor: remove duplicate TempLinkItem`
6. `refactor: remove unused AppPage`
7. `refactor: extract magic numbers to constants`
8. `refactor: split TilePanel into separate component files`
9. `refactor: extract navigation hooks from App.tsx`
10. `refactor: consolidate URL utilities`
11. `refactor: update barrel exports`
12. `docs: add CLAUDE.md architecture guide`
13. `refactor: complete code cleanup`

---

## If Something Breaks

1. Stop immediately
2. `git diff` to see what changed
3. `git checkout -- .` to revert uncommitted changes
4. Or `git revert <commit>` to undo a commit
5. Ask for help before proceeding
