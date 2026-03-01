import { test, expect, type Page } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI === "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

/** Open settings, expand Ticket Types section, return the dialog locator. */
async function openTicketTypeSettings(page: Page) {
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();
  await dlg.getByRole("button", { name: /ticket types/i }).click();
  return dlg;
}

test("new cards get the default ticket type", async ({ page }) => {
  // Create a column first
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();

  // Set default ticket type to "feat" (Feature)
  const dlg = await openTicketTypeSettings(page);
  const defaultSelect = dlg.getByTestId("default-ticket-type");
  await expect(defaultSelect).toBeVisible();
  await defaultSelect.selectOption("feat");
  await expect(defaultSelect).toHaveValue("feat");
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // Add a card — it should have the "feat" type badge
  await column.getByTestId("add-card-button-0").click();
  const card = page.getByTestId("card-0");
  await expect(card).toBeVisible();

  // The badge should show "feat-1" format
  await expect(card.locator("text=feat-1")).toBeVisible();
});

test("new cards have no type when default is None", async ({ page }) => {
  // Create a column
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();

  // Verify default type is None by default
  const dlg = await openTicketTypeSettings(page);
  const defaultSelect = dlg.getByTestId("default-ticket-type");
  await expect(defaultSelect).toHaveValue("");
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // Add a card — badge should show "#1" (no type prefix)
  await column.getByTestId("add-card-button-0").click();
  const card = page.getByTestId("card-0");
  await expect(card).toBeVisible();
  await expect(card.locator("text=#1")).toBeVisible();
});

test("default type persists to localStorage", async ({ page }) => {
  // Set default ticket type
  const dlg = await openTicketTypeSettings(page);
  await dlg.getByTestId("default-ticket-type").selectOption("fix");
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // Verify it was written to localStorage
  const stored = await page.evaluate(() =>
    localStorage.getItem("kanbeasy:defaultTicketType"),
  );
  expect(stored).toBe("fix");
});

test("default type clears when switching to a preset without that type", async ({
  page,
}) => {
  // Set default type to "feat" (development preset)
  const dlg = await openTicketTypeSettings(page);
  await dlg.getByTestId("default-ticket-type").selectOption("feat");
  await expect(dlg.getByTestId("default-ticket-type")).toHaveValue("feat");

  // Switch to "personal" preset which doesn't have "feat"
  await dlg.getByTestId("ticket-type-preset").selectOption("personal");

  // Default type should auto-clear to None
  await expect(dlg.getByTestId("default-ticket-type")).toHaveValue("");
});

test("default type clears when the selected type is removed", async ({
  page,
}) => {
  // Set default type to the first development type
  const dlg = await openTicketTypeSettings(page);
  await dlg.getByTestId("default-ticket-type").selectOption("feat");
  await expect(dlg.getByTestId("default-ticket-type")).toHaveValue("feat");

  // Expand editor and remove the "feat" type
  await dlg.getByTestId("ticket-type-editor-toggle").click();
  await dlg.getByTestId("ticket-type-remove-0").click();

  // Default type should auto-clear
  await expect(dlg.getByTestId("default-ticket-type")).toHaveValue("");
});

test("card detail modal shows the default ticket type on new card", async ({
  page,
}) => {
  // Create a column
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();

  // Set default type to "fix"
  const dlg = await openTicketTypeSettings(page);
  await dlg.getByTestId("default-ticket-type").selectOption("fix");
  await dlg.getByRole("button", { name: /close settings/i }).click();

  // Add a card and open detail modal
  await column.getByTestId("add-card-button-0").click();
  const card = page.getByTestId("card-0");
  await expect(card).toBeVisible();

  // Hover card to reveal controls, then click detail button
  await card.hover();
  await column.getByTestId("card-detail-0").click();

  // Verify the type selector shows "fix"
  const detailType = page.getByTestId("card-detail-type");
  await expect(detailType).toHaveValue("fix");
});
