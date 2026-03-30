# TileSpace TODO

## Deployment (Priority: High)

### Vercel Setup
- [ ] Create Vercel project and link to repo
- [ ] Set environment variables in Vercel dashboard:
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`
- [ ] Deploy and verify build succeeds

### Domain
- [ ] Purchase domain (e.g., tilespace.app, mytilespace.com)
- [ ] Configure DNS in Vercel
- [ ] Update Supabase Auth settings:
  - Site URL → production domain
  - Redirect URLs → add production domain
- [ ] Update Google OAuth:
  - Add production callback URL to authorized redirect URIs

---

## Security (Priority: High - Before Public Launch)

### Rate Limiting
- [ ] Add rate limiting to Supabase Edge Functions (if using quick-capture)
- [ ] Consider Vercel Edge Middleware for API rate limiting
- [ ] Limits to consider:
  - API calls: 100/minute per user
  - Tile creation: 10/minute per user
  - Link creation: 30/minute per user

### Input Validation
- [ ] Max tile title length (100 chars?)
- [ ] Max link title length (200 chars?)
- [ ] Max link URL length (2000 chars?)
- [ ] Max note content size (50KB?)
- [ ] Sanitize all user input (XSS prevention)

### Resource Limits Per User
- [ ] Max tiles per user: 100
- [ ] Max links per tile: 50
- [ ] Max total links per user: 500
- [ ] Max notes per user: 100
- [ ] Max note size: 50KB each
- [ ] Enforce limits in:
  - [ ] Frontend (UX feedback)
  - [ ] API layer (validation)
  - [ ] Database (constraints or triggers)

### Abuse Prevention
- [ ] Monitor for unusual activity patterns
- [ ] Add ability to disable/ban accounts if needed
- [ ] Consider email verification for new accounts
- [ ] CAPTCHA on signup? (maybe overkill for now)

---

## Landing Page (Priority: Medium)

### Design
- [ ] Hero section with tagline and screenshot
- [ ] Feature highlights (3-4 key benefits)
- [ ] How it works (simple steps)
- [ ] Call to action (Sign up with Google)
- [ ] Footer with links (Privacy, Terms, Contact)

### Implementation
- [ ] Create `/landing` or show on `/` for logged-out users
- [ ] Redirect authenticated users to `/app`
- [ ] Mobile responsive design

---

## Technical Debt

### Component Decomposition

**TilePanel.tsx (432 lines)** - Works but should be split for maintainability:

```
Current: TilePanel.tsx (~430 lines)

Target:
├── TilePanel.tsx          (~150 lines) - shell, state, layout
├── EmojiPicker.tsx        (~80 lines)  - emoji selection UI (reusable)
├── ColorPicker.tsx        (~60 lines)  - color selection UI (reusable)
├── TilePanelHeader.tsx    (~80 lines)  - header with emoji/color/close
└── TilePanelLinks.tsx     (~80 lines)  - link list and empty state
```

**store.ts (494 lines)** - Could be split by domain:

```
Current: store.ts (~494 lines)

Target:
├── store.ts               (~100 lines) - main store, combines slices
├── slices/tiles.ts        (~150 lines) - tile state and actions
├── slices/links.ts        (~150 lines) - link state and actions
├── slices/preferences.ts  (~50 lines)  - palette, user prefs
└── slices/ui.ts           (~50 lines)  - modals, selections
```

### Type Safety

- `store.ts` has several `any` type parameters that should be properly typed
- Run `npm run build` and fix remaining TypeScript errors

---

## Features to Test

- [ ] Drag tiles to reorder/swap positions
- [ ] Drag links between tiles
- [ ] Edit tile emoji and color
- [ ] Delete tiles (with confirmation)
- [ ] Add/edit/delete notes (documents)
- [ ] Markdown rendering in notes

---

## Future Enhancements

### Chrome Extension
- [ ] Generate proper icons (currently placeholder)
- [ ] Deploy edge function: `supabase functions deploy quick-capture`
- [ ] Test quick capture flow end-to-end

### UX Improvements
- [ ] Keyboard navigation between tiles (arrow keys)
- [ ] Search/filter tiles
- [ ] Tile reordering via drag on main grid
- [ ] Dark mode support

### Data
- [ ] Export/import tiles as JSON
- [ ] Backup reminders

---

## Notes

**Architecture principle:** This rebuild follows a layered architecture:
- UI Layer (components) → State Layer (Zustand) → Services (pure functions) → API Layer (Supabase)
- See README.md for details

**Line limits:** Target <300 lines per file. Current violations are noted above but don't block functionality.

**RLS:** Row Level Security is already configured - users can only access their own data. This is the foundation of multi-user security.
