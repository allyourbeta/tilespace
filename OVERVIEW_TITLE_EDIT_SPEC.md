# Overview Mode: Double-Click to Edit Page Title

## Summary

Allow editing page titles by double-clicking on the title text in Overview Mode. Also add tooltip for long titles.

## Current Behavior

- Click anywhere on page card → navigates to that page
- Three-dot menu → Rename → opens edit mode
- Long titles truncated with "..."

## New Behavior

### Double-Click to Edit
- Double-click on the title text → transforms into editable input
- Single click on card (not title) → still navigates to page
- Enter or blur → save changes
- Escape → cancel, revert to original

### Tooltip for Long Titles
- Hover over title for ~500ms → show full title in tooltip
- Only show tooltip if title is actually truncated

## Implementation Details

### In OverviewMode.tsx

1. **Add double-click handler to title element**
   ```tsx
   onDoubleClick={(e) => {
     e.stopPropagation(); // Prevent card click
     setEditingPageId(page.id);
     setEditValue(page.title);
   }}
   ```

2. **Prevent single click on title from navigating**
   ```tsx
   onClick={(e) => e.stopPropagation()}
   ```

3. **Add title attribute for native tooltip** (simplest approach)
   ```tsx
   <h3 title={page.title} className="...truncate...">
     {page.title}
   </h3>
   ```

4. **Max title length** — Add maxLength={50} to the input (generous limit)

### Keep Three-Dot Menu
- Keep "Rename" option in three-dot menu as fallback
- Some users prefer menu-based interaction

## Files to Modify

- `src/components/OverviewMode.tsx`

## Test Checklist

- [ ] Double-click title → edit mode activates
- [ ] Single click on title → does NOT navigate
- [ ] Single click on card (not title) → navigates to page
- [ ] Enter saves the new title
- [ ] Escape cancels editing
- [ ] Click outside saves the new title
- [ ] Long title shows tooltip on hover
- [ ] Three-dot menu Rename still works
- [ ] Max 50 characters enforced

## Notes

- Mobile UX unchanged for now (no double-click on touch)
- This is GitHub issue #22
