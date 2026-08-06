# TileSpace Backlog

## Features

- [ ] Deep link to pages via URL hash ^ts-zzit2l
  Spec: `docs/specs/deep-link-pages.md`

---

## Deployment (Priority: High)

### Vercel Setup

- [ ] Create Vercel project and link to repo ^ts-zciqfo

- [ ] Set environment variables in Vercel dashboard ^ts-7ls4de
  - `VITE_SUPABASE_URL`
  - `VITE_SUPABASE_ANON_KEY`

- [ ] Deploy and verify build succeeds ^ts-vcf72k

### Domain

- [ ] Purchase domain (e.g., tilespace.app, mytilespace.com) ^ts-llucxl

- [ ] Configure DNS in Vercel ^ts-wtfzbn

- [ ] Update Supabase Auth settings ^ts-c6fg5b
  - Site URL → production domain
  - Redirect URLs → add production domain

- [ ] Update Google OAuth ^ts-7itscq
  - Add production callback URL to authorized redirect URIs

---

## Security (Priority: High - Before Public Launch)

### Rate Limiting

- [ ] Add rate limiting to Supabase Edge Functions (if using quick-capture) ^ts-vtynpp

- [ ] Consider Vercel Edge Middleware for API rate limiting ^ts-tdd43a

- [ ] Limits to consider ^ts-jtlu2a
  - API calls: 100/minute per user
  - Tile creation: 10/minute per user
  - Link creation: 30/minute per user

### Input Validation

- [ ] Max tile title length (100 chars?) ^ts-ete4z7

- [ ] Max link title length (200 chars?) ^ts-bu3guu

- [ ] Max link URL length (2000 chars?) ^ts-y6yrp7

- [ ] Max note content size (50KB?) ^ts-joqdtq

- [ ] Sanitize all user input (XSS prevention) ^ts-hbdxpd

### Resource Limits Per User

- [ ] Max tiles per user: 100 ^ts-5om5pk

- [ ] Max links per tile: 50 ^ts-2twxqc

- [ ] Max total links per user: 500 ^ts-hzldbz

- [ ] Max notes per user: 100 ^ts-upkaga

- [ ] Max note size: 50KB each ^ts-kqlpaw

- [ ] Enforce limits in frontend, API layer, and database ^ts-2jvxr3
  - Frontend (UX feedback)
  - API layer (validation)
  - Database (constraints or triggers)

### Abuse Prevention

- [ ] Monitor for unusual activity patterns ^ts-3t3t4p

- [ ] Add ability to disable/ban accounts if needed ^ts-civpn4

- [ ] Consider email verification for new accounts ^ts-ugtzlw

- [ ] CAPTCHA on signup? (maybe overkill for now) ^ts-ibjxyy

---

## Landing Page (Priority: Medium)

### Design

- [ ] Hero section with tagline and screenshot ^ts-anbrw5

- [ ] Feature highlights (3-4 key benefits) ^ts-ikl4jp

- [ ] How it works (simple steps) ^ts-zsyktm

- [ ] Call to action (Sign up with Google) ^ts-ixv5wh

- [ ] Footer with links (Privacy, Terms, Contact) ^ts-nzetau

### Implementation

- [ ] Create `/landing` or show on `/` for logged-out users ^ts-yg5dyk

- [ ] Redirect authenticated users to `/app` ^ts-zuwrbl

- [ ] Mobile responsive design ^ts-uorpq4

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

- [ ] Drag tiles to reorder/swap positions ^ts-63lmpl

- [ ] Drag links between tiles ^ts-nvyemw

- [ ] Edit tile emoji and color ^ts-xvtpuy

- [ ] Delete tiles (with confirmation) ^ts-i777vb

- [ ] Add/edit/delete notes (documents) ^ts-txfrmq

- [ ] Markdown rendering in notes ^ts-gbezv2

---

## Future Enhancements

### Chrome Extension

- [ ] Generate proper icons (currently placeholder) ^ts-hxu2sp

- [ ] Deploy edge function: `supabase functions deploy quick-capture` ^ts-b2ro6p

- [ ] Test quick capture flow end-to-end ^ts-ii5lc2

### UX Improvements

- [ ] Keyboard navigation between tiles (arrow keys) ^ts-7ktfie

- [ ] Search/filter tiles ^ts-4ts5pk

- [ ] Tile reordering via drag on main grid ^ts-to6v7z

- [ ] Dark mode support ^ts-kyyjov

### Data

- [ ] Export/import tiles as JSON ^ts-mqzizt

- [ ] Backup reminders ^ts-dwqhuh

---

## Notes

**Architecture principle:** This rebuild follows a layered architecture:
UI Layer (components) → State Layer (Zustand) → Services (pure functions) → API Layer (Supabase).
See README.md for details.

**Line limits:** Target <300 lines per file. Current violations are noted above but don't block functionality.

**RLS:** Row Level Security is already configured - users can only access their own data. This is the foundation of multi-user security.
