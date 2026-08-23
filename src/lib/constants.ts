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

// Last-viewed page persistence (survives refresh)
export const PAGE_PERSISTENCE = {
  LAST_PAGE_KEY: 'tilespace_last_page',
} as const;

// Shell layout
export const LAYOUT = {
  SIDEBAR_WIDTH_PX: 236,
  SIDEBAR_COLLAPSED_PX: 60,
  GUTTER_PX: 28,
  HEADER_HEIGHT_PX: 60,
  FOOTER_HEIGHT_PX: 52,
  GRID_GAP_PX: 12,
  SIDEBAR_COLLAPSED_KEY: 'tilespace_sidebar_collapsed',
} as const;

// Timing
export const TIMING = {
  AUTOSAVE_DELAY_MS: 1000,
  DEBOUNCE_DELAY_MS: 300,
} as const;

