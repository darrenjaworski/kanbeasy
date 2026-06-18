/** Maximum number of undo/redo history entries kept in memory. */
export const MAX_UNDO_HISTORY = 50;

/** Fuse.js fuzzy-search threshold (0 = exact, 1 = match anything). */
export const SEARCH_FUZZY_THRESHOLD = 0.4;

/** Milliseconds to debounce IndexedDB board writes. */
export const WRITE_DEBOUNCE_MS = 100;

/** Milliseconds before the app loading skeleton is shown. */
export const SKELETON_DELAY_MS = 100;

/**
 * Milliseconds to wait for the `host:init` handshake reply in VS Code host mode
 * before giving up and rendering with a default board instead of hanging.
 */
export const HOST_INIT_TIMEOUT_MS = 5000;
