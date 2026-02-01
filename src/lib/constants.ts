// Centralized constants for TileSpace

// Special tile identifiers
export const INBOX_TILE = {
  TITLE: 'Inbox',
  EMOJI: '📥',
  COLOR: '#64748B',
} as const;

// App configuration
export const APP_CONFIG = {
  TITLE: 'TileSpace',
  MAX_TILES: 25,
} as const;

// Grid configuration
export const GRID_CONFIG = {
  BREAKPOINTS: [16, 20, 25] as const,
  MAX_TILES: 25,
  COLORS_PER_PALETTE: 12,
  TEMP_POSITION: -1, // Used for position swapping
} as const;

// Page title overlay
export const PAGE_TITLE_OVERLAY = {
  HOVER_ZONE_WIDTH_PX: 300,
  HOVER_ZONE_HEIGHT_PX: 160,
  FADE_TIMEOUT_MS: 2000,
} as const;

// Overview mode
export const OVERVIEW_MODE = {
  GRID_COLUMNS: 4,
} as const;

// Timing
export const TIMING = {
  AUTOSAVE_DELAY_MS: 1000,
  DEBOUNCE_DELAY_MS: 300,
} as const;

// Color utilities

/**
 * Calculate relative luminance of a hex color
 * Based on WCAG 2.0 formula
 */
function getLuminance(hexColor: string): number {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16) / 255;
  const g = parseInt(hex.substr(2, 2), 16) / 255;
  const b = parseInt(hex.substr(4, 2), 16) / 255;

  const toLinear = (c: number) => 
    c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Check if a color is "light" (needs dark text for contrast)
 * Returns true if the color is light, false if dark
 */
export function isLightColor(hexColor: string): boolean {
  return getLuminance(hexColor) > 0.5;
}

/**
 * Get button styles that ensure proper contrast
 * For light accent colors, use a dark fallback
 */
export function getButtonStyles(accentColor: string): {
  primary: { backgroundColor: string; color: string };
  secondary: { borderColor: string; color: string; backgroundColor: string };
} {
  const light = isLightColor(accentColor);
  
  if (light) {
    // Light accent color - use dark gray for primary, accent for secondary with dark text
    return {
      primary: {
        backgroundColor: '#374151', // gray-700
        color: '#ffffff',
      },
      secondary: {
        borderColor: '#6B7280', // gray-500
        color: '#374151', // gray-700
        backgroundColor: '#F3F4F6', // gray-100
      },
    };
  }
  
  // Dark accent color - use accent color normally
  return {
    primary: {
      backgroundColor: accentColor,
      color: '#ffffff',
    },
    secondary: {
      borderColor: accentColor,
      color: accentColor,
      backgroundColor: accentColor + '15', // 15% opacity
    },
  };
}
