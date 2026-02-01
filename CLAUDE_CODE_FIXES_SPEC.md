# Claude Code Prompt: TileSpace UI Fixes

## Context

TileSpace multi-page app is working. Three UI fixes needed.

## Fix 1: Remove Top Padding

There's wasted blank space at the top of the main tile grid. This was left over from a PageTitle component we removed. Find the tile grid container in `src/App.tsx` and remove the extra top padding so tiles fill the full screen.

## Fix 2: Bigger Overview Titles

In overview mode (`src/components/OverviewMode.tsx`), the page titles on each card in the 4x4 grid are too small to read easily. Make them considerably bigger and add a drop shadow for better readability against the colored backgrounds.

## Fix 3: Fix Drag-Drop in Overview Mode

In overview mode, you can drag page cards but cannot drop them to reorder. The drag starts but the drop doesn't register. Fix the drag-and-drop so pages can be reordered by dragging.

## Test Checklist

- [ ] Tiles fill the entire screen (no gap at top)
- [ ] Overview mode shows bigger, readable titles
- [ ] Can drag AND drop pages to reorder them in overview mode

## Deploy When Done

```bash
npm run build
git add .
git commit -m "Fix: remove top padding, bigger overview titles, fix drag-drop"
git push
vercel --prod
```
