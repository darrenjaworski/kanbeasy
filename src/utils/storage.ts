/**
 * Type-safe localStorage utilities with error handling.
 *
 * These utilities provide:
 * - SSR safety (checks for window)
 * - Automatic JSON serialization/deserialization
 * - Error handling with optional dev logging
 * - Type safety via generics
 */

const isDev = import.meta.env.DEV;

/**
 * Safely reads a value from localStorage and parses it as JSON.
 * Returns the fallback value if the key doesn't exist, parsing fails, or localStorage is unavailable.
 *
 * @param key - The localStorage key to read
 * @param fallback - The value to return if reading fails or key doesn't exist
 * @returns The stored value (parsed) or the fallback
 *
 * @example
 * const theme = getFromStorage('theme', 'light');
 * const settings = getFromStorage('settings', { enabled: false });
 */
export function getFromStorage<T>(key: string, fallback: T): T {
  // SSR safety
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const raw = window.localStorage.getItem(key);
    if (raw === null) {
      return fallback;
    }
    return JSON.parse(raw) as T;
  } catch (error) {
    if (isDev) {
      console.warn(`Failed to read from localStorage key "${key}":`, error);
    }
    return fallback;
  }
}

/**
 * Safely reads a string value from localStorage without JSON parsing.
 * Returns the fallback value if the key doesn't exist or localStorage is unavailable.
 *
 * @param key - The localStorage key to read
 * @param fallback - The value to return if reading fails or key doesn't exist
 * @returns The stored string or the fallback
 *
 * @example
 * const theme = getStringFromStorage('theme', 'light');
 */
export function getStringFromStorage(
  key: string,
  fallback: string
): string {
  // SSR safety
  if (typeof window === "undefined") {
    return fallback;
  }

  try {
    const value = window.localStorage.getItem(key);
    return value ?? fallback;
  } catch (error) {
    if (isDev) {
      console.warn(`Failed to read from localStorage key "${key}":`, error);
    }
    return fallback;
  }
}

/**
 * Safely writes a value to localStorage after JSON stringifying it.
 * Silently fails if localStorage is unavailable or quota is exceeded.
 *
 * @param key - The localStorage key to write to
 * @param value - The value to store (will be JSON stringified)
 *
 * @example
 * saveToStorage('theme', 'dark');
 * saveToStorage('settings', { enabled: true });
 */
export function saveToStorage<T>(key: string, value: T): void {
  // SSR safety
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (isDev) {
      console.warn(`Failed to write to localStorage key "${key}":`, error);
    }
    // Silently fail in production (quota exceeded, private browsing, etc.)
  }
}

/**
 * Safely writes a string value to localStorage without JSON stringifying.
 * Silently fails if localStorage is unavailable or quota is exceeded.
 *
 * @param key - The localStorage key to write to
 * @param value - The string value to store
 *
 * @example
 * saveStringToStorage('theme', 'dark');
 */
export function saveStringToStorage(key: string, value: string): void {
  // SSR safety
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(key, value);
  } catch (error) {
    if (isDev) {
      console.warn(`Failed to write to localStorage key "${key}":`, error);
    }
    // Silently fail in production (quota exceeded, private browsing, etc.)
  }
}

/**
 * Removes a value from localStorage.
 * Silently fails if localStorage is unavailable.
 *
 * @param key - The localStorage key to remove
 *
 * @example
 * removeFromStorage('theme');
 */
export function removeFromStorage(key: string): void {
  // SSR safety
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(key);
  } catch (error) {
    if (isDev) {
      console.warn(`Failed to remove from localStorage key "${key}":`, error);
    }
  }
}
