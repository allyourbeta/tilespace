# TileSpace: Page Dots Bar Redesign

## Summary

Remove the overview grid button. Make the page dots bar tappable to open overview mode.

## Current State

- Page dots at bottom center (small dots showing current page)
- Separate grid icon button at bottom right (opens overview)
- Tapping a dot navigates to that page

## New Design

### 1. Remove the Grid Button
Delete the overview toggle button (the LayoutGrid icon) from the bottom right. It's no longer needed.

### 2. Enlarge the Dots Bar
Make the dots bar taller with more padding so there's visible "background" around the dots. It should feel like a tappable pill/capsule, not just floating dots.

- Add more vertical padding (top and bottom)
- Keep the dots the same size
- The bar background should be clearly visible as a tappable surface

### 3. Tap Behavior
- **Tap a dot** → Navigate to that page (existing behavior)
- **Tap the bar background** (not a dot) → Open overview mode

### 4. Visual Feedback
- Add a hover/active state to the bar background to hint it's interactive
- Could be subtle opacity change or slight scale

## Files to Modify

- `src/components/PageDots.tsx` — Enlarge bar, add background tap handler
- `src/App.tsx` — Remove the grid button, pass `onOpenOverview` to PageDots

## Test Checklist

- [ ] Grid button is gone from bottom right
- [ ] Dots bar is visibly larger (more padding)
- [ ] Tapping a dot still navigates to that page
- [ ] Tapping the bar background opens overview
- [ ] Bar has hover/active feedback
