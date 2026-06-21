import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";
import { STORAGE_KEYS } from "../src/constants/storage";

export { expect };

/**
 * Declarative seed for the app's persisted state. Anything left undefined is
 * not written, so the app falls back to its own defaults.
 *
 * Encoding is handled here per key, matching how `db.ts` migrates localStorage
 * into IndexedDB (`migrateFromLocalStorage` tries `JSON.parse`, falling back to
 * the raw string): string settings are stored raw, while boolean flags read via
 * `kvGetBool` must be JSON-encoded so the parse yields the string `"true"`.
 */
export type SeedConfig = {
  /** Board state. Defaults to an empty board (`{ columns: [] }`). */
  board?: unknown;
  /** Active theme id, e.g. "dark-obsidian". Stored raw. */
  theme?: string;
  /** Theme preference: "light" | "dark" | "system". Stored raw. */
  themePreference?: string;
  /** Card density: "small" | "medium" | "large". Stored raw. */
  cardDensity?: string;
  /** View mode: "board" | "list" | "calendar". Stored raw. */
  viewMode?: string;
  /** Next auto-increment card number. Stored as a numeric string. */
  nextCardNumber?: number;
  /** Custom card types (object or pre-stringified JSON). */
  cardTypes?: unknown;
  /** Active card type preset id. Stored raw. */
  cardTypePreset?: string;
  /** Default card type id for new cards. Stored raw. */
  defaultCardType?: string;
  /** Keyboard shortcuts flag. JSON-encoded for `kvGetBool`. */
  keyboardShortcutsEnabled?: boolean;
  /**
   * Escape hatch for any other storage key — values are written verbatim, so
   * the caller is responsible for encoding (raw string vs JSON).
   */
  storage?: Record<string, string>;
  /**
   * When true, the welcome modal is left open (the "Get started" button is not
   * clicked). Use for specs that assert on the welcome modal itself.
   */
  skipWelcome?: boolean;
};

const APP_PATH = process.env.CI === "true" ? "/kanbeasy" : "/";

/** Build the [key, rawValue] pairs to write to localStorage for a seed. */
function buildStorageEntries(seed: SeedConfig): [string, string][] {
  const entries: [string, string][] = [];
  const raw = (key: string, value: string | undefined) => {
    if (value !== undefined) entries.push([key, value]);
  };
  const json = (key: string, value: unknown) => {
    if (value !== undefined)
      entries.push([
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      ]);
  };

  json(STORAGE_KEYS.BOARD, seed.board ?? { columns: [] });
  json(STORAGE_KEYS.CARD_TYPES, seed.cardTypes);

  raw(STORAGE_KEYS.THEME, seed.theme);
  raw(STORAGE_KEYS.THEME_PREFERENCE, seed.themePreference);
  raw(STORAGE_KEYS.CARD_DENSITY, seed.cardDensity);
  raw(STORAGE_KEYS.VIEW_MODE, seed.viewMode);
  raw(STORAGE_KEYS.CARD_TYPE_PRESET, seed.cardTypePreset);
  raw(STORAGE_KEYS.DEFAULT_CARD_TYPE, seed.defaultCardType);
  raw(
    STORAGE_KEYS.NEXT_CARD_NUMBER,
    seed.nextCardNumber !== undefined ? String(seed.nextCardNumber) : undefined,
  );

  // Booleans read via kvGetBool need the parsed value to be the string "true".
  if (seed.keyboardShortcutsEnabled !== undefined) {
    raw(
      STORAGE_KEYS.KEYBOARD_SHORTCUTS_ENABLED,
      JSON.stringify(String(seed.keyboardShortcutsEnabled)),
    );
  }

  if (seed.storage) {
    for (const [key, value] of Object.entries(seed.storage)) raw(key, value);
  }

  return entries;
}

/**
 * Register the seed as an init script. Must be called before the navigation
 * that loads it — the app migrates localStorage into IndexedDB on first load,
 * so seeding only takes effect on the first navigation in a context.
 */
export async function applySeed(
  page: Page,
  seed: SeedConfig = {},
): Promise<void> {
  const entries = buildStorageEntries(seed);
  await page.addInitScript((pairs: [string, string][]) => {
    for (const [key, value] of pairs) localStorage.setItem(key, value);
  }, entries);
}

/** Navigate to the app, dismissing the welcome modal unless `skipWelcome`. */
export async function gotoApp(
  page: Page,
  opts: { skipWelcome?: boolean } = {},
): Promise<void> {
  await page.goto(APP_PATH);
  if (!opts.skipWelcome) await page.getByTestId("get-started-button").click();
}

/** Seed state, navigate, and dismiss the welcome modal in one step. */
async function gotoSeeded(page: Page, seed: SeedConfig = {}): Promise<void> {
  await applySeed(page, seed);
  await gotoApp(page, { skipWelcome: seed.skipWelcome });
}

/**
 * Base test extended with a declarative `seed` option. Override it per file or
 * per describe with `test.use({ seed: { ... } })`; the overridden `page`
 * fixture seeds state, navigates, and dismisses the welcome modal before the
 * test body runs.
 */
export const test = base.extend<{ seed: SeedConfig }>({
  seed: [{}, { option: true }],
  // `run` is Playwright's fixture callback (conventionally named `use`); it is
  // renamed here so the react-hooks lint rule doesn't mistake it for React's
  // `use` hook.
  page: async ({ page, seed }, run) => {
    await gotoSeeded(page, seed);
    await run(page);
  },
});

/** Read a value from the kanbeasy IndexedDB kv store. Returns null if missing. */
export async function idbKvGet(page: Page, key: string): Promise<unknown> {
  return page.evaluate((k: string) => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("kanbeasy", 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("kv", "readonly");
        const getReq = tx.objectStore("kv").get(k);
        getReq.onsuccess = () => {
          db.close();
          resolve(getReq.result?.value ?? null);
        };
        getReq.onerror = () => {
          db.close();
          reject(getReq.error);
        };
      };
      req.onerror = () => reject(req.error);
    });
  }, key);
}

/** Read the default board state from IndexedDB. Returns null if missing. */
export async function idbGetBoard(page: Page): Promise<unknown> {
  return page.evaluate(() => {
    return new Promise((resolve, reject) => {
      const req = indexedDB.open("kanbeasy", 1);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction("board", "readonly");
        const getReq = tx.objectStore("board").get("default");
        getReq.onsuccess = () => {
          db.close();
          resolve(getReq.result?.state ?? null);
        };
        getReq.onerror = () => {
          db.close();
          reject(getReq.error);
        };
      };
      req.onerror = () => reject(req.error);
    });
  });
}

/** Create a card object for seeding localStorage. */
export function makeE2eCard(
  id: string,
  columnId: string,
  overrides: Record<string, unknown> = {},
) {
  const now = Date.now();
  return {
    id,
    number: 0,
    title: `Card ${id}`,
    description: "",
    cardTypeId: null,
    dueDate: null,
    createdAt: now,
    updatedAt: now,
    columnHistory: [{ columnId, enteredAt: now }],
    ...overrides,
  };
}

/** Create a full board object for seeding localStorage. */
export function seedBoard(
  columns: { id: string; title: string; cardCount: number }[],
) {
  const now = Date.now();
  return {
    columns: columns.map((col) => ({
      id: col.id,
      title: col.title,
      createdAt: now,
      updatedAt: now,
      cards: Array.from({ length: col.cardCount }, (_, i) =>
        makeE2eCard(`${col.id}-card-${i}`, col.id),
      ),
    })),
  };
}
