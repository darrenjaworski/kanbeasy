import { test as base, expect } from "@playwright/test";

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
    ticketTypeId: null,
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
