/**
 * localStorage keys used throughout the application.
 * Centralized to ensure consistency and make changes easier.
 */

export const STORAGE_KEYS = {
  /** Board state (columns and cards) */
  BOARD: "kanbeasy:board",

  /** Theme preference (light/dark) */
  THEME: "kanbeasy:theme",

  /** Card density setting (small/medium/large) */
  CARD_DENSITY: "kanbeasy:cardDensity",

  /** Column resizing feature flag */
  COLUMN_RESIZING_ENABLED: "kanbeasy:columnResizingEnabled",

  /** Delete column warning preference */
  DELETE_COLUMN_WARNING: "kanbeasy:deleteColumnWarning",

  /** Theme preference (light/dark/system) */
  THEME_PREFERENCE: "kanbeasy:themePreference",

  /** Owl mode easter egg */
  OWL_MODE_ENABLED: "kanbeasy:owlModeEnabled",

  /** View mode preference (board/list) */
  VIEW_MODE: "kanbeasy:viewMode",

  /** Next auto-increment card number counter */
  NEXT_CARD_NUMBER: "kanbeasy:nextCardNumber",

  /** Active ticket type preset ID */
  TICKET_TYPE_PRESET: "kanbeasy:ticketTypePreset",

  /** Custom ticket types JSON */
  TICKET_TYPES: "kanbeasy:ticketTypes",

  /** Default ticket type for new cards */
  DEFAULT_TICKET_TYPE: "kanbeasy:defaultTicketType",

  /** Compact header buttons (icon-only, no text labels) */
  COMPACT_HEADER: "kanbeasy:compactHeader",

  /** Settings modal section collapse state (JSON object) */
  SETTINGS_SECTIONS: "kanbeasy:settingsSections",

  /** Whether the user has seen the welcome modal */
  HAS_SEEN_WELCOME: "hasSeenWelcome",
} as const;
