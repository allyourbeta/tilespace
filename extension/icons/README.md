# Extension Icons

You need to create icon files for the Chrome extension:

- `icon16.png` - 16x16 pixels
- `icon48.png` - 48x48 pixels  
- `icon128.png` - 128x128 pixels

You can generate these from the favicon.svg in the project root, or create custom icons.

## Quick generation with ImageMagick:

```bash
# From the project root
convert -background none -resize 16x16 public/favicon.svg extension/icons/icon16.png
convert -background none -resize 48x48 public/favicon.svg extension/icons/icon48.png
convert -background none -resize 128x128 public/favicon.svg extension/icons/icon128.png
```

Or use any image editor to create PNG icons with the TileSpace branding.
