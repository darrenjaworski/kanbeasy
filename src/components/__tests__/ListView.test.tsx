import "@testing-library/jest-dom";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../../constants/storage";
import { CARD_TYPE_PRESETS } from "../../constants/cardTypes";
import { renderApp } from "../../test/renderApp";
import { seedBoard as seedBoardDb, seedKv } from "../../utils/db";

const devPreset = CARD_TYPE_PRESETS.find((p) => p.id === "development")!;

function seedBoard({
  cardTypeId = null as string | null,
  cardTypeLabel,
  cardTypeColor,
  description = "",
}: {
  cardTypeId?: string | null;
  cardTypeLabel?: string;
  cardTypeColor?: string;
  description?: string;
} = {}) {
  seedBoardDb({
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
            cardTypeId,
            ...(cardTypeLabel !== undefined && { cardTypeLabel }),
            ...(cardTypeColor !== undefined && { cardTypeColor }),
            dueDate: null,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            columnHistory: [{ columnId: "col-1", enteredAt: Date.now() }],
          },
        ],
      },
    ],
    archive: [],
  });
  // Start in list view
  seedKv(STORAGE_KEYS.VIEW_MODE, "list");
}

async function switchToListView() {
  const user = userEvent.setup();
  await user.click(screen.getByRole("radio", { name: /list view/i }));
}

describe("ListView type column", () => {
  beforeEach(() => {});

  it("shows Type column header", () => {
    seedBoard();
    renderApp();

    const table = screen.getByRole("table");
    expect(
      within(table).getByRole("columnheader", { name: "Type" }),
    ).toBeInTheDocument();
  });

  it("displays card type label with color when card has a type", () => {
    const featType = devPreset.types.find((t) => t.id === "feat")!;
    seedBoard({
      cardTypeId: "feat",
      cardTypeLabel: featType.label,
      cardTypeColor: featType.color,
    });
    seedKv(STORAGE_KEYS.CARD_TYPE_PRESET, "development");
    seedKv(STORAGE_KEYS.CARD_TYPES, devPreset.types);
    renderApp();

    const typeCell = screen.getByText(featType.label);
    expect(typeCell).toBeInTheDocument();
    expect(typeCell).toHaveStyle({ color: featType.color });
  });

  it("displays em dash when card has no type", () => {
    seedBoard({ cardTypeId: null });
    renderApp();

    const table = screen.getByRole("table");
    const rows = within(table).getAllByRole("row");
    // rows[0] is header, rows[1] is the data row
    const cells = within(rows[1]).getAllByRole("cell");
    // Type is the second cell (index 1): #, Type, Title, Due Date, Column, Created
    expect(cells[1]).toHaveTextContent("\u2014");
  });

  it("shows type column alongside other columns in correct order", () => {
    seedBoard({ cardTypeId: "feat" });
    seedKv(STORAGE_KEYS.CARD_TYPE_PRESET, "development");
    seedKv(STORAGE_KEYS.CARD_TYPES, devPreset.types);
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
    seedBoardDb({
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
              cardTypeId: "fix",
              cardTypeLabel: devPreset.types.find((t) => t.id === "fix")!.label,
              cardTypeColor: devPreset.types.find((t) => t.id === "fix")!.color,
              dueDate: null,
              createdAt: Date.now(),
              updatedAt: Date.now(),
              columnHistory: [{ columnId: "col-1", enteredAt: Date.now() }],
            },
          ],
        },
      ],
      archive: [],
    });
    seedKv(STORAGE_KEYS.CARD_TYPE_PRESET, "development");
    seedKv(STORAGE_KEYS.CARD_TYPES, devPreset.types);
    renderApp();

    await switchToListView();

    const fixType = devPreset.types.find((t) => t.id === "fix")!;
    expect(screen.getByText(fixType.label)).toBeInTheDocument();
  });
});
