# TileSpace Refactoring — Claude Code Prompt

## Instructions

Read `CLAUDE.md` before doing anything. Then review this entire prompt before writing any code.

## Goal

Refactor TileSpace so that every source file is under 300 lines and the codebase follows a clean layered architecture. **Do not change any user-facing behavior.** The app should look and work identically when you're done.

## Current Problems

1. **`App.tsx` (791 lines)** — God component. Holds all application state, ~25 handler functions, welcome-back/idle logic, and the full render tree. This is the primary target.
2. **`TilePanel/TilePanel.tsx` (470 lines)** — Too much logic mixed with UI.
3. **`lib/db.ts` (360 lines)** — Parallel/duplicate database layer. A newer `api/` directory already exists with the same operations split by domain, but `App.tsx` still imports from `db.ts`.
4. **`OverviewMode.tsx` (312 lines)** — Slightly over; may resolve naturally or need a small extraction.
5. **Incomplete migration** — `src/api/` and `src/services/` exist with good patterns but aren't wired in. `App.tsx` bypasses them entirely.

## Target Architecture

Follow this layered structure:

```
Components (UI + rendering only)
    ↓ consume
State (Zustand stores)
    ↓ call
Services (pure business logic functions — no React, no DB imports)
    ↓ call
API (all Supabase/database calls — the only layer that imports supabase client)
```

**Zustand** for state management. Install it (`npm install zustand`). Design the store(s) however makes sense — one store or multiple, slices or flat — based on the actual state shape and access patterns you find in `App.tsx`.

## Constraints

- **300-line hard limit** on every `.ts` and `.tsx` file in `src/`.  Test files are excluded from this limit.
- **No behavior changes.** Every user flow must work identically: auth, page navigation, tile CRUD, link CRUD, drag-and-drop, paste-link, documents, overview mode, welcome-back idle detection, palette changes, swipe navigation, keyboard navigation.
- **Preserve the existing `api/` and `services/` patterns** — extend them rather than replacing them with something new. The patterns in `api/tiles.ts`, `api/links.ts`, `services/LinkService.ts`, and `services/TileService.ts` are the templates to follow.
- **No new dependencies** beyond Zustand unless you encounter a clear need and explain it.
- **Respect existing code style:** TypeScript strict mode, path aliases (`@/`), barrel exports, naming conventions already in use.

## Migration Strategy

Work in phases. **After each phase, run `npm run build` and `npm run test` to confirm nothing is broken.** Do not proceed to the next phase if there are build errors or test failures.

### Phase 1: Consolidate the database layer
The `api/` directory already has `tiles.ts`, `links.ts`, `preferences.ts`, and `client.ts`. Compare these against `lib/db.ts` and reconcile — any functions in `db.ts` that are missing from `api/` need to be migrated there (page operations, etc.). Once all operations live in `api/`, update every import across the codebase to use `api/` and delete `lib/db.ts`. Do NOT change function signatures or behavior.

### Phase 2: Extract state into Zustand
Move the state currently in `App.tsx` into Zustand store(s). This includes page state, tile state, UI state (selected tile, modals, overview mode, etc.), and derived state. The store actions should call through services → API, not directly to Supabase. Keep the store(s) under 300 lines — split if needed.

### Phase 3: Slim down components
With state in Zustand, refactor `App.tsx`, `TilePanel.tsx`, and `OverviewMode.tsx` to be rendering-only. They should read from stores and dispatch actions — no business logic, no direct API calls. Extract sub-components or hooks as needed to stay under 300 lines.

### Phase 4: Fill in services layer
Any business logic currently in components (URL validation, duplicate checking, position calculations, idle detection, etc.) should live in `services/`. The existing `LinkService.ts` and `TileService.ts` show the pattern. Add `PageService.ts` and any others needed.

### Phase 5: Verify and clean up
- Confirm every file in `src/` (excluding tests) is under 300 lines.
- Remove any dead code, unused imports, or orphaned files.
- Update barrel exports (`index.ts` files).
- Run the full build and test suite.

## Testing Requirements

This is a significant refactoring. Testing is critical.

**Before starting any code changes:**
- Run `npm run build` and `npm run test` to establish the baseline. Record what passes and what fails. Nothing that currently passes should break.

**Existing tests:**
- `src/test/LinkService.test.ts` (240 lines)
- `src/test/TileService.test.ts` (167 lines)
- `src/test/grid.test.ts` (95 lines)
- `src/test/url.test.ts` (76 lines)
- `src/test/color.test.ts` (48 lines)

These must continue to pass. If you change the services API in a way that breaks existing tests, update the tests to match — but do not delete test coverage.

**New tests to add:**
- **Zustand store tests**: Test each store's actions and state transitions. Mock the API layer. Verify that actions produce the correct state changes and call the right API functions.
- **Service function tests**: Any new service functions (e.g., `PageService`) need unit tests following the patterns in the existing test files.
- **API layer tests** (if practical): At minimum, ensure the API barrel exports are correct and functions have the expected signatures.

Use the existing test infrastructure: Vitest, `@testing-library/jest-dom`, the setup file at `src/test/setup.ts`, and the `@/` path alias. Follow the mock/helper patterns already established in the existing test files.

**After all refactoring is complete:**
Run `npm run test:all` (which does build + test). Every test — old and new — must pass.

## Updating Docs

After the refactoring is complete, update `CLAUDE.md` to accurately reflect the new architecture: directory structure, state management approach, where things live, and how to add new features. Remove references to the old `lib/db.ts` approach and the previous refactoring history (it's in git). Keep it practical and current.

## Final Checklist

Before finishing, verify all of these:

- [ ] `npm run build` passes with zero errors
- [ ] `npm run test` passes — all old tests still green, new tests added and green
- [ ] No `.ts` or `.tsx` file in `src/` (excluding `src/test/`) exceeds 300 lines
- [ ] `App.tsx` contains no business logic — only rendering + store consumption
- [ ] All database calls go through `src/api/`, nowhere else
- [ ] `lib/db.ts` is deleted
- [ ] Services are pure functions with no React or Supabase imports
- [ ] `CLAUDE.md` reflects the current architecture
- [ ] The app works: auth, pages, tiles, links, drag-drop, documents, overview, palette, navigation
