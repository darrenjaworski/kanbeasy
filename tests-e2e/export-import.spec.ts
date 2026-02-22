import { test, expect } from "@playwright/test";
import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("kanbeasy:board", JSON.stringify({ columns: [] }));
  });
  const target = process.env.CI == "true" ? "/kanbeasy" : "/";
  await page.goto(target);

  await page.getByTestId("get-started-button").click();
});

test("can export board data as JSON", async ({ page }) => {
  // Create a column with a card
  await page.getByTestId("add-column-button").click();
  const column = page.getByTestId("column-0");
  await column.getByTestId("add-card-button-0").click();

  const card = column.getByTestId("card-content-0");
  await card.click();
  await card.fill("Export test card");
  await card.press("Enter");

  // Open settings and click export
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();

  // Listen for download
  const downloadPromise = page.waitForEvent("download");
  await dlg.getByRole("button", { name: /export board data/i }).click();
  const download = await downloadPromise;

  // Verify the download has a .json extension
  expect(download.suggestedFilename()).toMatch(/\.json$/);

  // Read and verify the exported content (v2 format: { version, board, settings })
  const filePath = await download.path();
  const content = JSON.parse(fs.readFileSync(filePath!, "utf-8"));
  expect(content).toHaveProperty("version", 2);
  expect(content).toHaveProperty("board");
  expect(content.board).toHaveProperty("columns");
  expect(content.board.columns).toHaveLength(1);
  expect(content.board.columns[0].cards[0].title).toBe("Export test card");
  expect(content).toHaveProperty("settings");
});

test("can import board data from JSON file", async ({ page }) => {
  // Prepare a v2 import file with proper structure
  const now = Date.now();
  const importData = {
    version: 2,
    exportedAt: new Date().toISOString(),
    board: {
      columns: [
        {
          id: "col-import-1",
          title: "Imported Column",
          createdAt: now,
          updatedAt: now,
          cards: [
            {
              id: "card-import-1",
              title: "Imported Card",
              createdAt: now,
              updatedAt: now,
              columnHistory: [{ columnId: "col-import-1", enteredAt: now }],
            },
          ],
        },
      ],
    },
    settings: {
      theme: "",
      themePreference: "system",
      cardDensity: "medium",
      columnResizingEnabled: "false",
      deleteColumnWarning: "true",
    },
  };

  const tmpDir = path.join(__dirname, "..", "node_modules", ".tmp-e2e");
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, "import-test.json");
  fs.writeFileSync(tmpFile, JSON.stringify(importData));

  // Open settings
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();

  // Trigger file import via the hidden input
  const fileInput = page.getByTestId("import-file-input");
  await fileInput.setInputFiles(tmpFile);

  // Wait for import to complete (button text changes)
  await expect(
    dlg.getByRole("button", { name: /import complete/i })
  ).toBeVisible({ timeout: 5000 });

  // Close settings and verify the imported data is on the board
  await dlg.getByRole("button", { name: /close settings/i }).click();

  const column = page.getByTestId("column-0");
  await expect(column).toBeVisible();
  await expect(column.getByTestId("column-title-input-0")).toHaveValue(
    "Imported Column"
  );
  await expect(column.getByTestId("card-content-0")).toHaveValue(
    "Imported Card"
  );

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

test("shows error for invalid import file", async ({ page }) => {
  const tmpDir = path.join(__dirname, "..", "node_modules", ".tmp-e2e");
  fs.mkdirSync(tmpDir, { recursive: true });
  const tmpFile = path.join(tmpDir, "bad-import.json");
  fs.writeFileSync(tmpFile, "not valid json {{{");

  // Open settings
  await page.getByRole("button", { name: /open settings/i }).click();
  const dlg = page.getByRole("dialog", { name: /settings/i });
  await expect(dlg).toBeVisible();

  // Trigger file import with bad data
  const fileInput = page.getByTestId("import-file-input");
  await fileInput.setInputFiles(tmpFile);

  // Should show an error alert
  await expect(dlg.getByRole("alert")).toBeVisible({ timeout: 5000 });

  // Cleanup
  fs.rmSync(tmpDir, { recursive: true, force: true });
});
