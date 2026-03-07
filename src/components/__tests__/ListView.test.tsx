import "@testing-library/jest-dom";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../../constants/storage";
import { TICKET_TYPE_PRESETS } from "../../constants/ticketTypes";
import { renderApp } from "../../test/renderApp";

const devPreset = TICKET_TYPE_PRESETS.find((p) => p.id === "development")!;

function seedBoard({
  ticketTypeId = null as string | null,
  ticketTypeLabel,
  ticketTypeColor,
  description = "",
}: {
  ticketTypeId?: string | null;
  ticketTypeLabel?: string;
  ticketTypeColor?: string;
  description?: string;
} = {}) {
  localStorage.setItem(
    STORAGE_KEYS.BOARD,
    JSON.stringify({
      columns: [
        {
          id: "col-1",
          title: "To Do",
          createdAt: Date.now(),
          updatedAt: Date.now(),
          cards: [
            {
              id: "card-1",
              number: 1,
              title: "Typed card",
              description,
              ticketTypeId,
              ...(ticketTypeLabel !== undefined && { ticketTypeLabel }),
              ...(ticketTypeColor !== undefined && { ticketTypeColor }),
              createdAt: Date.now(),
              updatedAt: Date.now(),
              columnHistory: [{ columnId: "col-1", enteredAt: Date.now() }],
            },
          ],
        },
      ],
    }),
  );
  // Start in list view
  localStorage.setItem(STORAGE_KEYS.VIEW_MODE, "list");
}

async function switchToListView() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("radio", { name: /list view/i }));
}

describe("ListView type column", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("shows Type column header", () => {
    seedBoard();
    renderApp();

    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "Type" }),
    ).toBeInTheDocument();
  });

  it("displays ticket type label with color when card has a type", () => {
    const featType = devPreset.types.find((t) => t.id === "feat")!;
    seedBoard({
      ticketTypeId: "feat",
      ticketTypeLabel: featType.label,
      ticketTypeColor: featType.color,
    });
    localStorage.setItem(STORAGE_KEYS.TICKET_TYPE_PRESET, "development");
    localStorage.setItem(
      STORAGE_KEYS.TICKET_TYPES,
      JSON.stringify(devPreset.types),
    );
    renderApp();

    const typeCell = screen.getByText(featType.label);
    expect(typeCell).toBeInTheDocument();
    expect(typeCell).toHaveStyle({ color: featType.color });
  });

  it("displays em dash when card has no type", () => {
    seedBoard({ ticketTypeId: null });
    renderApp();

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    // rows[0] is header, rows[1] is the data row
    const cells = within(rows[1]).getAllByRole("cell");
    // Type is the second cell (index 1): #, Type, Title, Due Date, Column, Created
    expect(cells[1]).toHaveTextContent("\u2014");
  });

  it("shows type column alongside other columns in correct order", () => {
    seedBoard({ ticketTypeId: "feat" });
    localStorage.setItem(STORAGE_KEYS.TICKET_TYPE_PRESET, "development");
    localStorage.setItem(
      STORAGE_KEYS.TICKET_TYPES,
      JSON.stringify(devPreset.types),
    );
    renderApp();

    const headers = screen
      .getAllByRole("columnheader")
      .map((h) => h.textContent);
    expect(headers).toEqual([
      "#",
      "Type",
      "Title",
      "Due Date",
      "Column",
      "Created",
    ]);
  });

  it("type column is visible after toggling to list view", async () => {
    // Start in board view, then switch
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({
        columns: [
          {
            id: "col-1",
            title: "Backlog",
            createdAt: Date.now(),
            updatedAt: Date.now(),
            cards: [
              {
                id: "card-1",
                number: 1,
                title: "Test",
                description: "",
                ticketTypeId: "fix",
                ticketTypeLabel: devPreset.types.find((t) => t.id === "fix")!
                  .label,
                ticketTypeColor: devPreset.types.find((t) => t.id === "fix")!
                  .color,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                columnHistory: [{ columnId: "col-1", enteredAt: Date.now() }],
              },
            ],
          },
        ],
      }),
    );
    localStorage.setItem(STORAGE_KEYS.TICKET_TYPE_PRESET, "development");
    localStorage.setItem(
      STORAGE_KEYS.TICKET_TYPES,
      JSON.stringify(devPreset.types),
    );
    renderApp();

    await switchToListView();

    const fixType = devPreset.types.find((t) => t.id === "fix")!;
    expect(screen.getByText(fixType.label)).toBeInTheDocument();
  });
});
