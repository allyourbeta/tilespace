# TileSpace: Page Title Display

## Summary

Show the page title in two non-intrusive ways:
1. Briefly when switching pages (fade in, then fade out)
2. On hover in top-left corner (appears while hovering)

## Behavior

### 1. Fade on Page Switch
When the user navigates to a different page (via dots, swipe, or arrow keys):
- Title fades in at top-left
- Stays visible for ~2 seconds
- Fades out smoothly
- Does NOT show on initial page load (only on page switch)

### 2. Hover to Reveal
When the user hovers near the top-left corner:
- Title fades in
- Stays visible while hovering
- Fades out when mouse leaves the area

### Visual Style
- Position: top-left corner, with padding from edges
- Background: translucent (black/20 or white/20 depending on readability)
- Text: white, medium size, readable but not dominant
- Rounded corners (like other UI elements)
- Smooth fade animation (200-300ms)

### Hover Zone
The hover detection area should be generous — maybe 150x80px in the top-left — so users don't have to hunt for it.

## Implementation Notes

- The two behaviors work together: if title is showing from page switch and user hovers, it just stays visible
- If user is hovering when they switch pages, title stays visible (no flicker)
- Use CSS transitions or framer-motion for smooth fades

## Files to Modify

- `src/App.tsx` or create `src/components/PageTitleOverlay.tsx`
- Track: currentPageId changes (for fade-on-switch), hover state (for hover reveal)

## Test Checklist

- [ ] Switch pages — title fades in, holds 2 sec, fades out
- [ ] Hover top-left — title appears
- [ ] Move mouse away — title fades out
- [ ] Hover during fade-out — title stays visible
- [ ] Title shows correct page name
- [ ] Title is readable but not intrusive
