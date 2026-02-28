import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

/** Add a column with a card so analytics button is enabled. */
async function addColumnWithCard(page: Page) {
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
}

test("can open and close the analytics modal", async ({ page }) => {
  await addColumnWithCard(page);
  await page.getByRole("button", { name: /open analytics/i }).click();
  const dlg = page.getByRole("dialog", { name: /analytics/i });
  await expect(dlg).toBeVisible();

  // Verify the title is present
  await expect(dlg.getByText("Analytics")).toBeVisible();

  // Close via close button
  await dlg.getByRole("button", { name: /close analytics/i }).click();
  await expect(dlg).not.toBeVisible();
});

test("shows metric cards with a single card", async ({ page }) => {
  await addColumnWithCard(page);
  await page.getByRole("button", { name: /open analytics/i }).click();
  const dlg = page.getByRole("dialog", { name: /analytics/i });
  await expect(dlg).toBeVisible();

  await expect(dlg.getByText("Total Cards", { exact: true })).toBeVisible();
  await expect(dlg.getByText("Cards in Flight", { exact: true })).toBeVisible();
  await expect(dlg.getByText("Avg Cycle Time")).toBeVisible();
  await expect(dlg.getByText("Throughput", { exact: true })).toBeVisible();

  // Cycle time should show "Not enough data" with only one card
  await expect(dlg.getByText("Not enough data").first()).toBeVisible();
});

test("shows correct total card count", async ({ page }) => {
  // Create a column with two cards
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();
  await column.getByTestId("add-card-button-0").click();

  await page.getByRole("button", { name: /open analytics/i }).click();
  const dlg = page.getByRole("dialog", { name: /analytics/i });
  await expect(dlg).toBeVisible();

  // The "2" should appear as the total card count
  const totalCardsSection = dlg
    .getByText("Total Cards", { exact: true })
    .locator("..");
  await expect(totalCardsSection.getByText("2")).toBeVisible();
});

test("can close analytics with Escape key", async ({ page }) => {
  await addColumnWithCard(page);
  await page.getByRole("button", { name: /open analytics/i }).click();
  const dlg = page.getByRole("dialog", { name: /analytics/i });
  await expect(dlg).toBeVisible();

  await page.keyboard.press("Escape");
  await expect(dlg).not.toBeVisible();
});

test("can close analytics by clicking backdrop", async ({ page }) => {
  await addColumnWithCard(page);
  await page.getByRole("button", { name: /open analytics/i }).click();
  const dlg = page.getByRole("dialog", { name: /analytics/i });
  await expect(dlg).toBeVisible();

  // Click in the top-left corner which is outside the centered dialog
  await page.mouse.click(5, 5);
  await expect(dlg).not.toBeVisible();
});

test("shows disclaimer text", async ({ page }) => {
  await addColumnWithCard(page);
  await page.getByRole("button", { name: /open analytics/i }).click();
  const dlg = page.getByRole("dialog", { name: /analytics/i });
  await expect(dlg).toBeVisible();

  await expect(
    dlg.getByText(/reordering columns resets all data/i),
  ).toBeVisible();
});
