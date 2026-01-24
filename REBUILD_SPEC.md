# TileSpace Rebuild Specification

## Context for AI Assistant

**What this is:** A clean-room rebuild of an existing app. The current codebase (Bolt-generated) has poor architecture. You are rebuilding from scratch with production-grade engineering.

**What you're provided:**
1. This spec (source of truth for requirements and architecture)
2. Existing source code zip (reference for UI/UX only — do not refactor, recreate)

**How to use the existing code:**
- UI reference: copy Tailwind classes, component structure, visual styling exactly
- Behavior reference: run through flows, mirror edge cases
- Do NOT attempt to clean up or refactor the existing code

**Target stack:**
- Vite + React 18
- TypeScript (strict mode, no `any` types)
- Tailwind CSS (match current styling exactly)
- Supabase (backend: auth, database, edge functions)

**Non-negotiables:**
1. Exact visual appearance (pixel-perfect match)
2. Keyboard shortcut quick-capture (Cmd+K)
3. Clean architecture per this spec (separation of concerns)
4. Multi-user with Google OAuth
5. Row Level Security on all data

**Definition of done:**
- All functionality works identically to current app
- All checklist items at end of spec are checked
- Tests exist for services and reducer
- No TypeScript errors or warnings
- Build succeeds with no warnings

---

## Executive Summary

Rebuild TileSpace with **production-grade architecture**. The current implementation works but has poor separation of concerns, making it fragile and hard to maintain. 

**This is a plumbing refactor, not a redesign.** The UI/UX must remain pixel-perfect identical. Only the internal architecture changes.

**New in this rebuild:** Multi-user support with Google OAuth authentication and complete data isolation via Row Level Security.

---

## CRITICAL ENGINEERING REQUIREMENTS

### These Are Non-Negotiable

1. **Separation of Concerns**
   - UI components contain ZERO business logic
   - State management is centralized in ONE place
   - Database operations are isolated in a data layer
   - Services contain ALL business rules

2. **No God Components**
   - No component file exceeds 200 lines
   - No component manages state for other components
   - No component makes database calls directly

3. **Single Source of Truth**
   - Application state lives in ONE store (React Context + useReducer, or Zustand)
   - Components read from the store via selectors/hooks
   - Components dispatch actions, never mutate state directly

4. **Functional State Updates**
   - ALL setState calls use functional form: `setState(prev => ...)` 
   - NEVER capture state in closures: `setState([...state, item])` ← WRONG
   - This prevents stale closure bugs

5. **Derived State**
   - If state B can be computed from state A, compute it (useMemo)
   - NEVER store derived state separately
   - Example: `selectedTile` is derived from `tiles` + `selectedTileId`

6. **Error Handling**
   - ALL async operations have try/catch
   - Errors are surfaced to the user (toast, banner, or inline)
   - No silent `console.error` failures

7. **Type Safety**
   - No `any` types anywhere
   - All function parameters and returns are typed
   - All component props have explicit interfaces

8. **Consistent Patterns**
   - All similar operations follow the same pattern
   - If one update is optimistic, all updates are optimistic
   - If one operation refetches, all operations refetch

---

## Architecture Specification

### Layer Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        UI Layer                              │
│  React Components: TileCard, TilePanel, DocumentEditor, etc │
│                                                              │
│  Rules:                                                      │
│  - Receive data via props or hooks (useAppState, useTiles)  │
│  - Emit events via callbacks (onSave, onDelete, onCreate)   │
│  - Contain ONLY rendering logic and local UI state          │
│  - Local UI state = things like "is dropdown open"          │
│  - NO business logic, NO validation, NO data fetching       │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                     State Layer                              │
│  Store: AppContext + useReducer (or Zustand)                │
│                                                              │
│  Contains:                                                   │
│  - tiles: Tile[]                                            │
│  - selectedTileId: string | null                            │
│  - editingDocumentId: string | null                         │
│  - currentPaletteId: string                                 │
│  - ui: { loading, error, modals }                           │
│                                                              │
│  Exposes:                                                    │
│  - Selector hooks: useTiles(), useSelectedTile(), etc.      │
│  - Action dispatcher: useAppDispatch()                      │
│                                                              │
│  Rules:                                                      │
│  - State is immutable, updated via reducer                  │
│  - Actions are plain objects: { type, payload }             │
│  - Async actions use thunks or separate action creators     │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                    Service Layer                             │
│  Services: TileService, LinkService, PreferenceService      │
│                                                              │
│  Contains ALL business logic:                                │
│  - findFirstEmptyPosition(tiles) → number                   │
│  - validateUrl(url) → boolean                               │
│  - getGridCapacity(tileCount) → 16 | 20 | 25               │
│  - checkDuplicateUrl(tile, url) → boolean                   │
│                                                              │
│  Rules:                                                      │
│  - Pure functions where possible                            │
│  - Services call API layer, never Supabase directly         │
│  - Services return data, state layer stores it              │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                      API Layer                               │
│  Client: api/tiles.ts, api/links.ts, api/preferences.ts    │
│                                                              │
│  Contains:                                                   │
│  - Raw Supabase queries                                     │
│  - Request/response transformation                          │
│  - Error normalization                                       │
│                                                              │
│  Rules:                                                      │
│  - One file per resource (tiles, links, preferences)        │
│  - Functions return typed data or throw typed errors        │
│  - NO business logic, just CRUD                             │
└─────────────────────────────────────────────────────────────┘
```

### File Structure

```
src/
├── components/           # UI Layer
│   ├── TileCard.tsx         # ~100 lines, display only
│   ├── TilePanel.tsx        # ~150 lines, may split further
│   ├── DocumentEditor.tsx   # ~120 lines
│   ├── FloatingActions.tsx  # ~80 lines
│   ├── PasteLinkModal.tsx   # ~100 lines
│   ├── PaletteSelector.tsx  # ~80 lines
│   ├── UserMenu.tsx         # ~60 lines, avatar + logout
│   └── ui/                  # Reusable UI primitives
│       ├── Modal.tsx
│       ├── Button.tsx
│       └── ConfirmDialog.tsx
│
├── pages/                # Page Components
│   ├── LoginPage.tsx        # Login screen with Google OAuth
│   └── AppPage.tsx          # Main app (tile grid + panels)
│
├── auth/                 # Authentication Layer
│   ├── AuthContext.tsx      # Auth provider + useAuth hook
│   ├── AuthGuard.tsx        # Route protection
│   └── api.ts               # Supabase auth calls
│
├── state/                # State Layer
│   ├── AppContext.tsx       # Context provider + reducer
│   ├── actions.ts           # Action type definitions
│   ├── reducer.ts           # State reducer (pure function)
│   ├── selectors.ts         # Memoized selectors
│   └── hooks.ts             # useAppState, useTiles, etc.
│
├── services/             # Service Layer
│   ├── TileService.ts       # Tile business logic
│   ├── LinkService.ts       # Link business logic
│   └── PreferenceService.ts # Palette/preferences logic
│
├── api/                  # API Layer
│   ├── client.ts            # Supabase client singleton
│   ├── tiles.ts             # Tile CRUD operations
│   ├── links.ts             # Link CRUD operations
│   └── preferences.ts       # Preference operations
│
├── types/                # Shared Types
│   ├── tile.ts
│   ├── link.ts
│   ├── palette.ts
│   └── user.ts
│
├── utils/                # Pure Utilities
│   ├── url.ts               # URL validation/normalization
│   ├── color.ts             # Color utilities
│   └── grid.ts              # Grid calculations
│
├── App.tsx               # Root component, ~30 lines
│                         # Sets up providers + routing
│
└── main.tsx              # Entry point
```

---

## Detailed Specifications

### Tiles

**Data Model:**
```typescript
interface Tile {
  id: string;           // UUID from database
  title: string;        // User-editable, default "New Tile"
  emoji: string;        // Single emoji character
  accentColor: string;  // Hex color from current palette
  colorIndex: number;   // 0-11, index into palette
  position: number;     // 0 to (gridCapacity - 1)
  links: Link[];        // Nested links, loaded with tile
  createdAt: string;    // ISO timestamp
  updatedAt: string;    // ISO timestamp
}
```

**Business Rules:**
- Maximum 25 tiles
- Positions are 0-indexed integers
- Position is UNIQUE — no two tiles share a position
- Grid capacity: 16 (1-16 tiles), 20 (17-20 tiles), 25 (21-25 tiles)
- New tile position = first empty slot in range [0, gridCapacity)
- Deleting a tile leaves a gap (positions do NOT compact)
- Tile color is determined by: `palette.colors[colorIndex % 12]`

**Position Assignment Algorithm:**
```typescript
function findFirstEmptyPosition(tiles: Tile[]): number {
  const count = tiles.length;
  if (count >= 25) throw new Error('Maximum tiles reached');
  
  const capacity = count < 16 ? 16 : count < 20 ? 20 : 25;
  const occupied = new Set(tiles.map(t => t.position));
  
  for (let pos = 0; pos < capacity; pos++) {
    if (!occupied.has(pos)) return pos;
  }
  
  throw new Error('No empty position found');
}
```

### Links

**Data Model:**
```typescript
interface Link {
  id: string;           // UUID from database
  tileId: string;       // Parent tile UUID
  type: 'link' | 'document';
  title: string;        // Display title
  url: string | null;   // URL for links, null for documents
  summary: string;      // Optional description
  content: string;      // Markdown content for documents
  position: number;     // Order within tile
  createdAt: string;
}
```

**Business Rules:**
- Links belong to exactly one tile
- URL is normalized: trimmed, https:// prepended if missing
- URL is validated: must be valid http/https URL
- Duplicate URLs within same tile are rejected
- Documents have url=null and type='document'
- Position determines display order within tile

### Palettes

**Data Model:**
```typescript
interface Palette {
  id: string;           // 'ocean', 'sunset', etc.
  name: string;         // Display name
  category: 'vibrant' | 'muted';
  background: string;   // Page background color
  border: string;       // Tile border color
  colors: string[];     // 12 accent colors
}
```

**Business Rules:**
- Changing palette recolors all tiles
- Each tile keeps its colorIndex, color recalculated from new palette
- Default palette: 'ocean'

### Grid

**Capacity Calculation:**
```typescript
function getGridCapacity(tileCount: number): 16 | 20 | 25 {
  if (tileCount <= 16) return 16;
  if (tileCount <= 20) return 20;
  return 25;
}

function getGridConfig(capacity: number): { cols: number; rows: number } {
  switch (capacity) {
    case 16: return { cols: 4, rows: 4 };
    case 20: return { cols: 5, rows: 4 };
    case 25: return { cols: 5, rows: 5 };
  }
}
```

**Rendering:**
- Render `gridCapacity` cells
- Each cell is either a tile (if tile exists at that position) or empty slot
- Empty slots accept tile drops

---

## User Actions (Complete List)

### Tile Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Create tile | Click + menu → "Add New Tile" | Find first empty position, create tile, open panel |
| Select tile | Click tile | Open panel, set selectedTileId |
| Close panel | Click X or outside | Clear selectedTileId |
| Edit title | Type in title field | Auto-save on blur |
| Change emoji | Click emoji → picker | Save immediately |
| Change color | Click color dot | Save immediately |
| Delete tile | Click "Delete Tile" | Confirm (2x if has links), delete tile + links, leave gap |
| Move tile | Drag to empty slot | Update position |
| Swap tiles | Drag tile onto tile | Swap positions |

### Link Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Add link | Click "Add Link" in panel | Show inline input, save on blur/Enter |
| Edit link | Click "Edit" on link row | Show edit form, save on blur |
| Delete link | Click trash on link row | Delete immediately (no confirm) |
| Open link | Click link title (if URL) | Open in new tab |
| Move link | Drag link to tile in grid | Move link to target tile |

### Note Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Add note | Click "Add Note" in panel | Create empty document, open editor |
| Edit note | Click note row | Open editor |
| Save note | Auto after 1s, or on close | Save title + content + summary |
| Delete note | Click trash in editor | Confirm, delete, close editor |
| Close editor | Click X | If empty, delete. If changed, save. Close. |

### Quick Capture (Chrome Extension)

| Action | Trigger | Behavior |
|--------|---------|----------|
| Capture link | Cmd+K (or configured) | Send URL+title to edge function → save to Inbox |

### Palette Actions

| Action | Trigger | Behavior |
|--------|---------|----------|
| Change palette | Click palette picker → select | Debounce 300ms, recolor all tiles |

---

## State Management Specification

### State Shape

```typescript
interface AppState {
  // Auth (managed by AuthContext, separate from AppContext)
  // user: User | null;  — in AuthContext
  
  // Data
  tiles: Tile[];
  currentPaletteId: string;
  
  // UI State
  selectedTileId: string | null;
  editingDocumentId: string | null;
  
  // Async State
  loading: boolean;
  error: string | null;
  
  // Modal State
  modals: {
    pasteLink: boolean;
  };
}

// Auth state is separate (AuthContext)
interface AuthState {
  user: User | null;
  loading: boolean;
}
```

### Derived State (compute, don't store)

```typescript
// In selectors.ts
export const selectSelectedTile = (state: AppState): Tile | null => {
  if (!state.selectedTileId) return null;
  return state.tiles.find(t => t.id === state.selectedTileId) ?? null;
};

export const selectEditingDocument = (state: AppState): Link | null => {
  if (!state.editingDocumentId) return null;
  for (const tile of state.tiles) {
    const link = tile.links?.find(l => l.id === state.editingDocumentId);
    if (link) return link;
  }
  return null;
};

export const selectGridCapacity = (state: AppState): number => {
  return getGridCapacity(state.tiles.length);
};

export const selectCanAddTile = (state: AppState): boolean => {
  return state.tiles.length < 25;
};
```

### Action Types

```typescript
type AppAction =
  // Data loading
  | { type: 'LOAD_START' }
  | { type: 'LOAD_SUCCESS'; tiles: Tile[]; paletteId: string }
  | { type: 'LOAD_ERROR'; error: string }
  
  // Tiles
  | { type: 'TILE_CREATED'; tile: Tile }
  | { type: 'TILE_UPDATED'; id: string; updates: Partial<Tile> }
  | { type: 'TILE_DELETED'; id: string }
  | { type: 'TILES_SWAPPED'; idA: string; idB: string; posA: number; posB: number }
  | { type: 'TILE_MOVED'; id: string; position: number }
  
  // Links
  | { type: 'LINK_CREATED'; tileId: string; link: Link }
  | { type: 'LINK_UPDATED'; id: string; updates: Partial<Link> }
  | { type: 'LINK_DELETED'; tileId: string; linkId: string }
  | { type: 'LINK_MOVED'; linkId: string; fromTileId: string; toTileId: string; link: Link }
  
  // Palette
  | { type: 'PALETTE_CHANGED'; paletteId: string; tiles: Tile[] }
  
  // UI
  | { type: 'SELECT_TILE'; id: string | null }
  | { type: 'EDIT_DOCUMENT'; id: string | null }
  | { type: 'SHOW_MODAL'; modal: keyof AppState['modals'] }
  | { type: 'HIDE_MODAL'; modal: keyof AppState['modals'] }
  | { type: 'CLEAR_ERROR' };
```

### Reducer Rules

```typescript
// In reducer.ts
export function appReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'TILE_CREATED':
      return {
        ...state,
        tiles: [...state.tiles, action.tile],
        selectedTileId: action.tile.id,
      };
    
    case 'TILE_UPDATED':
      return {
        ...state,
        tiles: state.tiles.map(t =>
          t.id === action.id ? { ...t, ...action.updates } : t
        ),
      };
    
    // ... etc
  }
}
```

---

## UI Preservation Requirements

### DO NOT CHANGE

1. **Visual appearance** — colors, spacing, fonts, shadows, borders
2. **Tailwind classes** — keep all existing classes
3. **Component structure** — keep JSX hierarchy
4. **Animations** — transitions, hovers, transforms
5. **Responsive behavior** — if any exists

### DO CHANGE

1. **Props interfaces** — may simplify or restructure
2. **Event handlers** — wire to dispatch instead of callbacks
3. **State access** — use hooks instead of props drilling
4. **Imports** — point to new service/state layers

### Component Refactoring Pattern

**Before (current):**
```tsx
function TileCard({ tile, onClick, onDragStart, ... }) {
  return (
    <div onClick={() => onClick(tile)} ...>
      {/* JSX with Tailwind */}
    </div>
  );
}
```

**After (refactored):**
```tsx
function TileCard({ tile }: { tile: Tile }) {
  const dispatch = useAppDispatch();
  
  const handleClick = () => dispatch({ type: 'SELECT_TILE', id: tile.id });
  
  return (
    <div onClick={handleClick} ...>
      {/* SAME JSX with SAME Tailwind */}
    </div>
  );
}
```

---

## Database Schema (Multi-User with RLS)

**IMPORTANT:** This replaces the existing single-user schema. All tables have `user_id` and Row Level Security.

### Enable RLS and Create Policies

```sql
-- Run this FIRST before creating tables
ALTER DATABASE postgres SET "app.jwt_secret" TO 'your-jwt-secret';
```

### tiles
```sql
CREATE TABLE tiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  emoji TEXT NOT NULL,
  accent_color TEXT NOT NULL,
  color_index INTEGER NOT NULL DEFAULT 0,
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Position is unique PER USER, not globally
  UNIQUE(user_id, position)
);

-- Enable Row Level Security
ALTER TABLE tiles ENABLE ROW LEVEL SECURITY;

-- Users can only see their own tiles
CREATE POLICY "Users can view own tiles" ON tiles
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own tiles
CREATE POLICY "Users can insert own tiles" ON tiles
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own tiles
CREATE POLICY "Users can update own tiles" ON tiles
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own tiles
CREATE POLICY "Users can delete own tiles" ON tiles
  FOR DELETE USING (auth.uid() = user_id);
```

### links
```sql
CREATE TABLE links (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tile_id UUID NOT NULL REFERENCES tiles(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'link',
  title TEXT NOT NULL,
  url TEXT,
  summary TEXT DEFAULT '',
  content TEXT DEFAULT '',
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE links ENABLE ROW LEVEL SECURITY;

-- Users can only see their own links
CREATE POLICY "Users can view own links" ON links
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own links
CREATE POLICY "Users can insert own links" ON links
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own links
CREATE POLICY "Users can update own links" ON links
  FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own links
CREATE POLICY "Users can delete own links" ON links
  FOR DELETE USING (auth.uid() = user_id);
```

### user_preferences
```sql
CREATE TABLE user_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  current_palette TEXT NOT NULL DEFAULT 'ocean',
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE user_preferences ENABLE ROW LEVEL SECURITY;

-- Users can only see their own preferences
CREATE POLICY "Users can view own preferences" ON user_preferences
  FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own preferences
CREATE POLICY "Users can insert own preferences" ON user_preferences
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own preferences
CREATE POLICY "Users can update own preferences" ON user_preferences
  FOR UPDATE USING (auth.uid() = user_id);
```

### Indexes for Performance

```sql
CREATE INDEX idx_tiles_user_id ON tiles(user_id);
CREATE INDEX idx_tiles_user_position ON tiles(user_id, position);
CREATE INDEX idx_links_user_id ON links(user_id);
CREATE INDEX idx_links_tile_id ON links(tile_id);
```

---

## Authentication Specification

### Overview

- **Provider:** Google OAuth via Supabase Auth
- **Flow:** Dedicated login page → Google OAuth → Redirect to app
- **Session:** Managed by Supabase, stored in localStorage
- **Protection:** All app routes require authentication

### Auth State

```typescript
interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
}

interface User {
  id: string;           // UUID from Supabase auth
  email: string;
  name: string;
  avatarUrl: string;    // Google profile picture
}
```

### Auth Context

```typescript
// src/auth/AuthContext.tsx
interface AuthContextValue {
  user: User | null;
  loading: boolean;
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
}

// Provider wraps entire app
// Listens to Supabase auth state changes
// Redirects to /login if not authenticated
```

### File Structure (Auth)

```
src/
├── auth/
│   ├── AuthContext.tsx      # Auth provider + hooks
│   ├── AuthGuard.tsx        # Protects routes, redirects if not logged in
│   └── api.ts               # Supabase auth calls
│
├── pages/
│   ├── LoginPage.tsx        # Dedicated login page
│   └── AppPage.tsx          # Main app (protected)
```

### Login Page Design

```
┌─────────────────────────────────────────┐
│                                         │
│                                         │
│              TileSpace                  │
│                                         │
│     ┌─────────────────────────────┐     │
│     │  🔵 Continue with Google    │     │
│     └─────────────────────────────┘     │
│                                         │
│                                         │
└─────────────────────────────────────────┘

- Centered vertically and horizontally
- "TileSpace" in large, bold text
- Google sign-in button (standard Google branding)
- Clean, minimal design matching app aesthetic
- Background color from default palette
```

### Login Flow

```
1. User visits app
2. AuthGuard checks session
3. No session → Redirect to /login
4. User clicks "Continue with Google"
5. Supabase OAuth flow (popup or redirect)
6. Google authenticates user
7. Supabase creates/updates user record
8. Redirect back to app
9. AuthGuard sees session → Render app
10. App fetches user's tiles (RLS filters automatically)
```

### Logout Flow

```
1. User clicks avatar/menu in app
2. User clicks "Sign Out"
3. Supabase clears session
4. Redirect to /login
```

### Auth Implementation

```typescript
// src/auth/AuthContext.tsx
import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../api/client';
import { User, Session } from '@supabase/supabase-js';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUser(session?.user ?? null);
      }
    );

    return () => subscription.unsubscribe();
  }, []);

  const signInWithGoogle = async () => {
    await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin,
      },
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, loading, signInWithGoogle, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
```

### AuthGuard Component

```typescript
// src/auth/AuthGuard.tsx
export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!user) {
    return null; // Will redirect
  }

  return <>{children}</>;
}
```

### Supabase Setup Required

In Supabase Dashboard:

1. **Authentication → Providers → Google**
   - Enable Google provider
   - Add Google OAuth credentials (Client ID, Client Secret)
   - Set redirect URL

2. **Authentication → URL Configuration**
   - Site URL: `https://your-app-domain.com`
   - Redirect URLs: `https://your-app-domain.com`, `http://localhost:5173`

---

## Chrome Extension Authentication

### Overview

The Chrome extension needs to authenticate to save links to the user's Inbox. It shares the auth session with the web app.

### How It Works

1. User logs into TileSpace web app (creates Supabase session)
2. Extension checks for existing Supabase session in browser storage
3. When user presses Cmd+K, extension:
   - Retrieves auth token from Supabase session
   - Sends token + URL + title to edge function
4. Edge function validates token, extracts user_id, saves link

### Extension Changes

```typescript
// In extension's background.js or content script

async function captureLink(url: string, title: string) {
  // Get Supabase session from storage
  const { data: { session } } = await supabase.auth.getSession();
  
  if (!session) {
    // Not logged in - show message to user
    showNotification('Please log in to TileSpace first');
    return;
  }
  
  const response = await fetch(EDGE_FUNCTION_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${session.access_token}`,
    },
    body: JSON.stringify({ url, title }),
  });
  
  if (response.ok) {
    showNotification('Saved to Inbox!');
  } else {
    showNotification('Failed to save');
  }
}
```

### Edge Function Changes

```typescript
// supabase/functions/quick-capture/index.ts

Deno.serve(async (req: Request) => {
  // ... CORS handling ...

  // Extract and validate JWT
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const token = authHeader.replace('Bearer ', '');
  
  // Verify token and get user
  const supabase = createClient(supabaseUrl, supabaseServiceKey);
  const { data: { user }, error: authError } = await supabase.auth.getUser(token);
  
  if (authError || !user) {
    return new Response(
      JSON.stringify({ error: 'Invalid token' }),
      { status: 401, headers: corsHeaders }
    );
  }

  const userId = user.id;

  // Now create/find Inbox for THIS USER
  const { data: existingInbox } = await supabase
    .from('tiles')
    .select('id')
    .eq('user_id', userId)
    .eq('title', 'Inbox')
    .maybeSingle();

  // ... rest of logic, always including user_id in inserts ...
});
```

---

## API Layer Changes for Multi-User

### All Queries Automatically Filtered

With RLS enabled, you don't need to add `WHERE user_id = X` to queries. Supabase does it automatically based on the authenticated user's JWT.

```typescript
// This automatically returns only the current user's tiles
const { data: tiles } = await supabase
  .from('tiles')
  .select('*')
  .order('position');
```

### All Inserts Must Include user_id

```typescript
// Get current user's ID
const { data: { user } } = await supabase.auth.getUser();

// Include user_id in all inserts
const { data, error } = await supabase
  .from('tiles')
  .insert({
    user_id: user.id,  // REQUIRED
    title: 'New Tile',
    emoji: '📦',
    accent_color: '#3B82F6',
    color_index: 0,
    position: nextPosition,
  })
  .select()
  .single();
```

### Helper for User ID

```typescript
// src/api/client.ts
export async function getCurrentUserId(): Promise<string> {
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) {
    throw new Error('Not authenticated');
  }
  return user.id;
}
```

---

## User Menu (Logout UI)

### Location

Small avatar in bottom-right corner of app (opposite the + menu).

### Design

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                      [Grid of tiles]                         │
│                                                              │
│                                                              │
│  [+ Menu]                                          [Avatar]  │
└──────────────────────────────────────────────────────────────┘

Avatar click opens menu:
┌─────────────────┐
│ user@email.com  │
│ ─────────────── │
│ Sign Out        │
└─────────────────┘
```

### Implementation

```tsx
// src/components/UserMenu.tsx
export function UserMenu() {
  const { user, signOut } = useAuth();
  const [isOpen, setIsOpen] = useState(false);

  if (!user) return null;

  return (
    <div className="fixed bottom-4 right-4 z-40">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-10 h-10 rounded-full overflow-hidden border-2 border-white shadow-lg"
      >
        <img src={user.user_metadata.avatar_url} alt="" className="w-full h-full" />
      </button>
      
      {isOpen && (
        <div className="absolute bottom-full right-0 mb-2 bg-white rounded-lg shadow-xl border p-2 min-w-[200px]">
          <p className="px-3 py-2 text-sm text-gray-600 truncate">
            {user.email}
          </p>
          <hr className="my-1" />
          <button
            onClick={signOut}
            className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded"
          >
            Sign Out
          </button>
        </div>
      )}
    </div>
  );
}
```
);
```

---

## Testing Requirements

### Required Tests

1. **Unit tests for services**
   - `findFirstEmptyPosition` — all edge cases
   - `validateUrl` — valid/invalid URLs
   - `getGridCapacity` — boundary conditions

2. **Unit tests for reducer**
   - Each action type produces correct state

3. **Integration tests**
   - Create tile → appears in state
   - Delete tile → removed, gap preserved
   - Move link → updates both tiles

### Test Framework

Use Vitest (already in Vite ecosystem).

---

## Future Features (Post-Rebuild)

These features are OUT OF SCOPE for the rebuild. Document them here for future implementation once the clean architecture is in place.

### 1. Multi-Page Support

**Concept:** Instead of one grid, users have multiple "pages" (like workspaces), each with its own tiles.

**Requirements:**
- Each page has its own:
  - Title (user-editable)
  - Color palette (independent of other pages)
  - Set of tiles (positions are per-page)
- Swipe left/right to navigate between pages (mobile-native gesture)
- Visual transition animation between pages
- Page indicator dots at bottom (like iOS home screen)

**Data Model Changes:**
```typescript
interface Page {
  id: string;
  user_id: string;
  title: string;
  paletteId: string;
  position: number;      // Order among pages
  createdAt: string;
}

interface Tile {
  // ... existing fields ...
  page_id: string;       // NEW: which page this tile belongs to
}
```

**Database Changes:**
```sql
CREATE TABLE pages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  title TEXT NOT NULL DEFAULT 'Untitled',
  palette_id TEXT NOT NULL DEFAULT 'ocean',
  position INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, position)
);

-- Add page_id to tiles
ALTER TABLE tiles ADD COLUMN page_id UUID REFERENCES pages(id) ON DELETE CASCADE;

-- Update unique constraint: position is unique per page, not globally
ALTER TABLE tiles DROP CONSTRAINT tiles_user_id_position_key;
ALTER TABLE tiles ADD CONSTRAINT tiles_page_position_key UNIQUE(page_id, position);
```

---

### 2. Cross-Page Tile Dragging

**Concept:** Drag a tile and hold at screen edge to switch pages, then drop on new page.

**Requirements:**
- Drag tile to left/right edge of screen
- After 500ms hold, animate page transition
- Show target page with drop zones
- Drop tile into position on new page
- Update tile's page_id in database

**UX Pattern:** Similar to dragging apps between home screens on iOS/Android.

---

### 3. Page Titles with Visual Display

**Concept:** Each page has a title displayed attractively at the top.

**Requirements:**
- Title displayed at top of page (subtle, not intrusive)
- Tap to edit inline
- Style matches page's palette
- Optional: subtitle or description

**Design Options:**
- Floating title bar with blur/transparency
- Title integrated into background
- Minimal text that fades on scroll

---

### 4. Page Navigation Menu

**Concept:** Quick-jump to any page by title, not just swiping.

**Requirements:**
- Navigation menu accessible from any page
- Shows all page titles in a list or grid
- Tap to jump directly to that page
- Visual indicator of current page
- Option to reorder pages from this menu

**UX Options:**
- Bottom sheet with page list
- Dropdown from title
- Long-press on page dots to show menu
- Command-palette style search (Cmd+P)

---

### 5. Search Functionality

**Concept:** Search across tiles, links, and notes to find content quickly.

**Requirements:**
- Search bar (global, accessible from any page)
- Search scope options:
  - Titles only (fastest)
  - Titles + summaries
  - Titles + summaries + note content (full-text)
- Results show:
  - Which page the item is on
  - Which tile it belongs to
  - Snippet of matching content
- Click result to navigate to that page/tile

**Implementation Options:**
- Client-side filtering (fast for small datasets)
- Supabase full-text search (scales better)
- Hybrid: client-side for titles, server for content

**Database Changes (if using Supabase FTS):**
```sql
-- Add full-text search index
ALTER TABLE links ADD COLUMN fts tsvector 
  GENERATED ALWAYS AS (
    to_tsvector('english', coalesce(title, '') || ' ' || coalesce(summary, '') || ' ' || coalesce(content, ''))
  ) STORED;

CREATE INDEX links_fts_idx ON links USING GIN (fts);
```

---

### 6. RAG for Notes (AI-Powered Search)

**Concept:** Use Retrieval-Augmented Generation to query your notes with natural language.

**Requirements:**
- "Ask your notes" feature
- Natural language queries like "What did I save about React hooks?"
- AI retrieves relevant notes and synthesizes an answer
- Citations back to source notes

**Implementation Approach:**
1. Generate embeddings for note content (OpenAI or similar)
2. Store embeddings in Supabase pgvector
3. On query: embed the question, find similar notes
4. Send relevant notes + question to LLM for answer
5. Display answer with links to source notes

**Database Changes:**
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Add embedding column to links (for documents)
ALTER TABLE links ADD COLUMN embedding vector(1536);

-- Create index for similarity search
CREATE INDEX links_embedding_idx ON links 
  USING ivfflat (embedding vector_cosine_ops)
  WITH (lists = 100);
```

**Edge Function:** New function to handle RAG queries:
- Receive question
- Generate embedding
- Query similar documents
- Call LLM with context
- Return synthesized answer

---

### 7. Visual Depth & 3D Effects (Spaces-Style)

**Concept:** Move from flat design to a more dimensional, Apple Spaces-inspired aesthetic.

**Requirements:**
- Tiles have subtle depth (shadows, layers)
- Page transitions feel spatial (zoom, parallax)
- "All pages" view shows pages as 3D cards in space
- Hover/touch effects suggest physicality

**Design Inspiration:**
- macOS Spaces (Mission Control)
- iOS App Library
- Material Design 3 elevation system
- Apple's visionOS spatial design

**Specific Effects:**
- **Tiles:** 
  - Subtle shadow suggesting lift
  - Hover raises tile slightly
  - Press depresses tile
  - Drag shows tile "picked up" with stronger shadow

- **Page Transitions:**
  - Swipe causes pages to slide with parallax
  - Current page scales down slightly as next approaches
  - Smooth spring physics, not linear

- **All Pages View:**
  - Pinch or gesture to zoom out
  - See all pages as cards in a grid/carousel
  - 3D perspective tilt based on scroll position
  - Pages cast shadows on surface below

- **Background:**
  - Subtle gradient or texture, not pure flat color
  - Slight blur/glass effect on overlays
  - Ambient lighting that responds to palette

**Technical Approach:**
- CSS transforms (translateZ, rotateX/Y)
- Framer Motion for physics-based animations
- CSS backdrop-filter for blur effects
- Three.js for true 3D (optional, more complex)

**Performance Considerations:**
- Use `will-change` for animated elements
- GPU-accelerated transforms only
- Reduce effects on low-power devices
- Test on mobile for smoothness

---

### Feature Priority Suggestion

| Priority | Feature | Complexity | User Value |
|----------|---------|------------|------------|
| 1 | Multi-Page Support | High | High |
| 2 | Page Navigation Menu | Low | High |
| 3 | Page Titles | Low | Medium |
| 4 | Search (titles/summaries) | Medium | High |
| 5 | Cross-Page Tile Dragging | Medium | Medium |
| 6 | Visual Depth/3D | Medium | Medium |
| 7 | Search (full-text) | Medium | Medium |
| 8 | RAG for Notes | High | Medium |

**Recommendation:** Implement 1-4 first. They deliver the most value with reasonable complexity. RAG is cool but niche — save it for later.

---

### 8. Cloud Deployment

**Concept:** Deploy TileSpace to the cloud for real-world multi-user access.

**Requirements:**
- Host frontend on Vercel (or Netlify)
- Use dedicated Supabase project (your own account, not Bolt's)
- Custom domain (optional, e.g., tilespace.app)
- Environment variables properly configured
- HTTPS enforced

**Deployment Checklist:**
```
[ ] Create new Supabase project in your account
[ ] Run all migrations to set up schema
[ ] Enable Google OAuth in Supabase Auth settings
[ ] Configure redirect URLs for production domain
[ ] Deploy frontend to Vercel
[ ] Set environment variables in Vercel:
    - VITE_SUPABASE_URL
    - VITE_SUPABASE_ANON_KEY
[ ] Deploy edge function (quick-capture)
[ ] Update Chrome extension with production URL
[ ] Test full flow end-to-end
```

---

### 9. Landing Page

**Concept:** Public-facing page that explains TileSpace and prompts login.

**Requirements:**
- Clean, attractive landing page at root URL (/)
- Brief explanation of what TileSpace does
- Screenshots or demo GIF
- "Sign in with Google" button
- Links to privacy policy / terms (if needed)
- Redirects to app after successful login

**Design:**
- Matches app aesthetic (uses same palette system)
- Mobile-responsive
- Fast loading (minimal JS)
- Could be a simple static page or React route

**Route Structure:**
```
/           → Landing page (public)
/login      → Login page (public, redirects if already logged in)
/app        → Main app (protected, requires auth)
```

---

### 10. Restricted Access (Pre-Launch Mode)

**Concept:** Multi-user architecture is in place, but only your account can access the app until you're ready to launch.

**Requirements:**
- Google OAuth enabled (anyone can attempt to sign in)
- Only whitelisted emails can actually use the app
- Non-whitelisted users see "Access restricted" message
- Easy to add more users to whitelist later
- Easy to remove restriction entirely when ready to launch

**Implementation Options:**

**Option A: Database Allowlist (Recommended)**
```sql
-- Create allowlist table
CREATE TABLE allowed_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Seed with your email
INSERT INTO allowed_users (email) VALUES ('your.email@gmail.com');

-- RLS policy: only allowed users can access tiles
CREATE POLICY "Only allowed users can access tiles" ON tiles
  FOR ALL USING (
    auth.uid() IN (
      SELECT au.id FROM auth.users au
      JOIN allowed_users aw ON au.email = aw.email
    )
  );
```

**Option B: Supabase Auth Restrictions**
- In Supabase Dashboard → Authentication → Policies
- Restrict sign-ups to specific email domains
- Or manually approve each user

**Option C: Application-Level Check**
```typescript
// In AuthGuard or after login
const ALLOWED_EMAILS = ['your.email@gmail.com'];

if (!ALLOWED_EMAILS.includes(user.email)) {
  return <RestrictedAccessPage />;
}
```

**Restricted Access Page:**
```
┌─────────────────────────────────────────┐
│                                         │
│              TileSpace                  │
│                                         │
│     Access is currently restricted.     │
│                                         │
│     Signed in as: user@example.com      │
│                                         │
│     ┌─────────────────────────────┐     │
│     │        Sign Out             │     │
│     └─────────────────────────────┘     │
│                                         │
│   Interested in access? Contact...      │
│                                         │
└─────────────────────────────────────────┘
```

**Launching to Public:**
When ready to open up:
- Option A: `DELETE FROM allowed_users;` then drop the policy
- Option B: Change Supabase auth settings
- Option C: Remove the email check from code

---

### 11. Data Migration from Bolt

**Concept:** Move your existing tiles/links from Bolt's Supabase to your own.

**Requirements:**
- Export data from Bolt's Supabase (if accessible)
- Import into your new Supabase project
- Assign all data to your user_id after first login
- Verify data integrity

**Migration Script:**
```typescript
// Run once after setting up new Supabase and logging in

async function migrateData(exportedData: any, newUserId: string) {
  // Insert tiles with new user_id
  for (const tile of exportedData.tiles) {
    await supabase.from('tiles').insert({
      ...tile,
      id: undefined,  // Let DB generate new ID
      user_id: newUserId,
    });
  }
  
  // Map old tile IDs to new tile IDs
  // Insert links with updated tile_id and user_id
  // ...
}
```

**If Bolt's Supabase is inaccessible:**
- Manually recreate tiles (you said there's not much data)
- Or: screenshot current state for reference, recreate from scratch

---

### Updated Feature Priority

| Priority | Feature | Complexity | User Value | Phase |
|----------|---------|------------|------------|-------|
| **0** | **Clean Rebuild (current spec)** | **High** | **Critical** | **Now** |
| 1 | Cloud Deployment | Low | Critical | Post-rebuild |
| 2 | Restricted Access | Low | Critical | Post-rebuild |
| 3 | Landing Page | Low | High | Post-rebuild |
| 4 | Data Migration | Low | High | Post-rebuild |
| 5 | Multi-Page Support | High | High | Future |
| 6 | Page Navigation Menu | Low | High | Future |
| 7 | Page Titles | Low | Medium | Future |
| 8 | Search (titles/summaries) | Medium | High | Future |
| 9 | Cross-Page Tile Dragging | Medium | Medium | Future |
| 10 | Visual Depth/3D | Medium | Medium | Future |
| 11 | Search (full-text) | Medium | Medium | Future |
| 12 | RAG for Notes | High | Medium | Future |

**Recommended Order:**
1. Complete rebuild with clean architecture + auth
2. Deploy to cloud with restricted access (just you)
3. Add landing page
4. Use it yourself, find bugs, iterate
5. When stable, add multi-page and other features
6. When ready to share, remove access restriction

---

## Success Criteria

The rebuild is COMPLETE when:

- [ ] All existing functionality works identically
- [ ] UI is pixel-perfect match to current app
- [ ] No component file exceeds 200 lines
- [ ] App.tsx is under 50 lines
- [ ] All state flows through central store
- [ ] All business logic is in services
- [ ] All API calls are in api layer
- [ ] No `any` types in codebase
- [ ] All async errors show user feedback
- [ ] Unit tests exist for services and reducer
- [ ] Adding a new feature requires changing max 2 files
- [ ] Google OAuth login works
- [ ] Users only see their own data (RLS verified)
- [ ] Chrome extension captures work for logged-in users
- [ ] Logout clears session and redirects to login

---

## What NOT To Do

1. **DO NOT** redesign the UI
2. **DO NOT** add new features (beyond auth)
3. **DO NOT** change the visual styling
4. **DO NOT** use a different CSS approach
5. **DO NOT** add new dependencies without justification
6. **DO NOT** write clever code — write obvious code
7. **DO NOT** optimize prematurely
8. **DO NOT** skip error handling
9. **DO NOT** leave TODO comments — finish it or don't start it
10. **DO NOT** store user_id client-side for queries (RLS handles it)
11. **DO NOT** trust client-side auth checks alone (RLS is the real gate)
12. **DO NOT** expose service role key to client (only in edge functions)

---

## Delivery Checklist

Before declaring done:

**Build & Types:**
- [ ] `npm run build` succeeds with no warnings
- [ ] `npm run typecheck` passes with no errors
- [ ] `npm run test` passes all tests
- [ ] No `any` types anywhere in codebase

**Auth Flow:**
- [ ] Login page renders correctly
- [ ] Google OAuth initiates properly
- [ ] Successful login redirects to app
- [ ] App shows user's tiles after login
- [ ] Logout clears session
- [ ] Logout redirects to login page
- [ ] Direct app URL without auth redirects to login

**Core Functionality:**
- [ ] Create tile → appears in correct position
- [ ] Edit tile title → saves and displays
- [ ] Change tile color → saves and displays
- [ ] Delete empty tile → single confirm, removes tile
- [ ] Delete tile with links → double confirm, removes all
- [ ] Drag tile to empty slot → moves
- [ ] Drag tile onto tile → swaps
- [ ] Add link → saves and displays
- [ ] Edit link → saves and displays
- [ ] Delete link → removes
- [ ] Drag link to tile → moves to new tile
- [ ] Add note → creates document, opens editor
- [ ] Edit note → auto-saves content
- [ ] Close empty note → deletes it
- [ ] Change palette → all tiles recolor

**Quick Capture (Extension):**
- [ ] Cmd+K when logged in → saves to Inbox
- [ ] Cmd+K when logged out → shows "please login" message
- [ ] Saved link appears in Inbox tile

**Multi-User Verification:**
- [ ] Create 2 test users
- [ ] User A's tiles not visible to User B
- [ ] User B's tiles not visible to User A
- [ ] Direct database query with User A's token returns only User A's data

**Code Quality:**
- [ ] No file exceeds 200 lines
- [ ] No component contains business logic
- [ ] No API call outside api/ folder
- [ ] All errors surface to user
- [ ] Screenshots: before/after comparison shows identical UI
