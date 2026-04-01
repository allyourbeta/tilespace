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

// Welcome-back overview
export const WELCOME_BACK = {
  IDLE_THRESHOLD_MS: 30000, // 30 seconds
  LAST_ACTIVE_KEY: 'tilespace_last_active',
} as const;

// Timing
export const TIMING = {
  AUTOSAVE_DELAY_MS: 1000,
  DEBOUNCE_DELAY_MS: 300,
} as const;

