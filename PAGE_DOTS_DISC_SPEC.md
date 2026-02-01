# TileSpace: Page Dots Bar Redesign

## Summary

Replace the separate overview grid button with a disc integrated into the page dots bar.

## Current State

- Page dots bar at bottom center (slim bar with dots)
- Separate grid icon button at bottom right corner
- The bar was made thicker to allow tapping — revert to slim

## New Design

### 1. Remove the Grid Button
Delete the LayoutGrid icon button from the bottom right corner entirely.

### 2. Add Overview Disc Inside the Dots Bar
- Add a small disc on the LEFT side of the dots, inside the bar
- The disc should be brighter than the bar background (white/60 or similar)
- The disc contains a small grid icon
- The bar should flow around the disc — there should be visible padding between the disc and the bar edges
- Clicking the disc opens overview mode

### 3. Return Bar to Slim Height
The bar should be slim like it was originally — just enough to hold the dots comfortably. The disc fits inside this slim bar with a bit of breathing room.

### Visual Reference
```
[  ◉  • • • ● • • • • • • • • • • •  ]
   ^                                   
   disc (brighter, contains grid icon)
```

- Disc: ~6-7px tall, rounded, bg-white/60, grid icon inside
- Bar: slim, bg-black/20, rounded-full
- Dots: same as before (2.5px, current page highlighted)

### 4. Behavior
- Click disc → open overview mode
- Click dot → navigate to that page
- Hover on disc → slightly brighter (white/70)

## Files to Modify

- `src/components/PageDots.tsx` — Add disc, revert to slim bar
- `src/App.tsx` — Remove grid button, pass onOpenOverview to PageDots

## Test Checklist

- [ ] Grid button removed from bottom right
- [ ] Bar is slim (not thick)
- [ ] Disc visible on left side inside bar
- [ ] Disc has grid icon
- [ ] Disc is brighter than bar background
- [ ] Bar visibly wraps around disc (padding visible)
- [ ] Clicking disc opens overview
- [ ] Clicking dots still navigates pages
