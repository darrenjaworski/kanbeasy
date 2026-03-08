import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

export { expect };

/**
 * Shared fixture that seeds an empty board, navigates to the app,
 * and dismisses the welcome modal.
 */
export const test = base.extend<{ boardPage: never }>({
  boardPage: [
    async ({ page }, use) => {
      await page.addInitScript(() => {
        localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
      });
      const target = process.env.CI === "true" ? "/kanbeasy" : "/";
      await page.goto(target);
      await page.getByTestId("get-started-button").click();
      await use(page as never);
    },
    { auto: true },
  ],
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
