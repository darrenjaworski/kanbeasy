import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { STORAGE_KEYS } from "../../constants/storage";
import { CARD_TYPE_PRESETS } from "../../constants/cardTypes";
import { renderApp } from "../../test/renderApp";
import { seedBoard as seedBoardDb, seedKv } from "../../utils/db";

import type * as HooksModule from "../../hooks";

vi.mock("../../hooks", async (importOriginal) => ({
  ...(await importOriginal<HooksModule>()),
  useIsMobile: () => true,
}));

const devPreset = CARD_TYPE_PRESETS.find((p) => p.id === "development")!;
const featType = devPreset.types.find((t) => t.id === "feat")!;

function seedBoard({
  cardTypeId = null as string | null,
  cardTypeLabel,
  cardTypeColor,
  dueDate = null as string | null,
} = {}) {
  seedBoardDb({
    columns: [
      {
        id: "col-1",
        title: "In Progress",
        createdAt: Date.now(),
        updatedAt: Date.now(),
        cards: [
          {
            id: "card-1",
            number: 1,
            title: "My card",
            description: "",
            cardTypeId,
            ...(cardTypeLabel !== undefined && { cardTypeLabel }),
            ...(cardTypeColor !== undefined && { cardTypeColor }),
            dueDate,
            createdAt: new Date("2025-01-15").getTime(),
            updatedAt: Date.now(),
            columnHistory: [{ columnId: "col-1", enteredAt: Date.now() }],
          },
        ],
      },
    ],
    archive: [],
  });
  seedKv(STORAGE_KEYS.VIEW_MODE, "list");
}

describe("ListView mobile card list", () => {
  it("renders a list, not a table", () => {
    seedBoard();
    renderApp();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
    expect(screen.getByRole("list")).toBeInTheDocument();
  });

  it("shows the card title", () => {
    seedBoard();
    renderApp();
    expect(screen.getByText("My card")).toBeInTheDocument();
  });

  it("shows the column name", () => {
    seedBoard();
    renderApp();
    expect(screen.getByText("Column: In Progress")).toBeInTheDocument();
  });

  it("shows the created date", () => {
    seedBoard();
    renderApp();
    expect(screen.getByText(/Created:/)).toBeInTheDocument();
    expect(screen.getByText(/Jan/)).toBeInTheDocument();
  });

  it("shows type label when card has a type", () => {
    seedBoard({
      cardTypeId: featType.id,
      cardTypeLabel: featType.label,
      cardTypeColor: featType.color,
    });
    seedKv(STORAGE_KEYS.CARD_TYPE_PRESET, "development");
    seedKv(STORAGE_KEYS.CARD_TYPES, devPreset.types);
    renderApp();
    expect(screen.getByText(/Type:/)).toBeInTheDocument();
    expect(screen.getByText(featType.label)).toBeInTheDocument();
  });

  it("omits the type line when card has no type", () => {
    seedBoard({ cardTypeId: null });
    renderApp();
    expect(screen.queryByText(/Type:/)).not.toBeInTheDocument();
  });

  it("shows due date when present", () => {
    seedBoard({ dueDate: "2025-06-15" });
    renderApp();
    expect(screen.getByText(/Due:/)).toBeInTheDocument();
    expect(screen.getByText(/Jun/)).toBeInTheDocument();
  });

  it("omits due date line when absent", () => {
    seedBoard({ dueDate: null });
    renderApp();
    expect(screen.queryByText(/Due:/)).not.toBeInTheDocument();
  });

  it("opens card detail modal when tapping a card", async () => {
    seedBoard();
    renderApp();
    const user = userEvent.setup();
    await user.click(screen.getByRole("button", { name: /My card/i }));
    expect(screen.getByTestId("card-detail-due-date")).toBeInTheDocument();
  });
});
