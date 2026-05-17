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
  MAX_TILES: 30,
} as const;

// Grid configuration
export const GRID_CONFIG = {
  BREAKPOINTS: [16, 20, 30] as const,
  MAX_TILES: 30,
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

// Welcome-back overview
export const WELCOME_BACK = {
  IDLE_THRESHOLD_MS: 300000, // 300 seconds
  LAST_ACTIVE_KEY: 'tilespace_last_active',
} as const;

// Timing
export const TIMING = {
  AUTOSAVE_DELAY_MS: 1000,
  DEBOUNCE_DELAY_MS: 300,
} as const;

// Tile visual effects — tweak these to taste
export const TILE_VISUALS = {
  /** Resting tilt angle in degrees. 0 = flat, 2-3 = subtle, 5 = dramatic */
  TILT_DEGREES: 4,
  /** Shadow offset and blur for resting tiles (directional, top-left light) */
  RESTING_SHADOW: '4px 6px 16px rgba(60, 40, 100, 0.3), 2px 2px 4px rgba(60, 40, 100, 0.15)',
  /** Shadow on hover (flatter, softer — card settles down) */
  HOVER_SHADOW: '2px 3px 10px rgba(60, 40, 100, 0.2), 1px 1px 3px rgba(60, 40, 100, 0.1)',
  /** Shadow when lifted (on hover for tile cards on pages — card rises up) */
  LIFTED_SHADOW: '8px 12px 32px rgba(60, 40, 100, 0.35), 3px 4px 8px rgba(60, 40, 100, 0.15)',
} as const;

