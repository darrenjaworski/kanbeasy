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
} as const;
