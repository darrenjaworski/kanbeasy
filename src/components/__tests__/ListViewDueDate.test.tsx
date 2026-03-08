import "@testing-library/jest-dom";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../../constants/storage";
import { renderApp } from "../../test/renderApp";
import { seedBoard as seedBoardDb, seedKv } from "../../utils/db";

function seedBoard(dueDate: string | null = null) {
  const now = Date.now();
  seedBoardDb({
    columns: [
      {
        id: "col-1",
        title: "Todo",
        createdAt: now,
        updatedAt: now,
        cards: [
          {
            id: "card-1",
            number: 1,
            title: "Test Card",
            description: "Some description",
            cardTypeId: null,
            dueDate,
            createdAt: now,
            updatedAt: now,
            columnHistory: [{ columnId: "col-1", enteredAt: now }],
          },
        ],
      },
    ],
    archive: [],
  });
  seedKv(STORAGE_KEYS.VIEW_MODE, "list");
}

describe("ListView due date column", () => {
  beforeEach(() => {});

  it("shows Due Date column header instead of Description", () => {
    seedBoard();
    renderApp();
    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toContain("Due Date");
    expect(headers).not.toContain("Description");
  });

  it("displays formatted due date when card has one", () => {
    seedBoard("2025-06-15");
    renderApp();
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    const cells = within(rows[1]).getAllByRole("cell");
    // Due Date is the 4th cell (index 3): #, Type, Title, Due Date, Column, Created
    expect(cells[3].textContent).toMatch(/Jun/);
    expect(cells[3].textContent).toMatch(/15/);
  });

  it("displays em dash when card has no due date", () => {
    seedBoard(null);
    renderApp();
    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    const cells = within(rows[1]).getAllByRole("cell");
    expect(cells[3]).toHaveTextContent("\u2014");
  });

  it("opens card detail modal when clicking a row", async () => {
    seedBoard("2025-06-15");
    renderApp();
    const user = userEvent.setup();

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    await user.click(rows[1]);

    // Card detail modal should open with the due date field
    expect(screen.getByTestId("card-detail-due-date")).toBeInTheDocument();
  });
});
