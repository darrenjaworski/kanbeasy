import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../constants/storage";
import { seedBoard as seedBoardDb, seedKv, kvGet } from "../utils/db";
import { renderApp } from "../test/renderApp";

function seedBoard() {
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
            title: "Task",
            description: "",
            cardTypeId: null,
            dueDate: null,
            createdAt: now,
            updatedAt: now,
            columnHistory: [{ columnId: "col-1", enteredAt: now }],
          },
        ],
      },
    ],
    archive: [],
  });
}

describe("Compact header", () => {
  beforeEach(() => {
    seedBoard();
  });

  it("shows text labels by default", () => {
    renderApp();
    expect(screen.getByText("Board")).toBeInTheDocument();
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Analytics")).toBeInTheDocument();
  });

  it("hides text labels when compact header is enabled", () => {
    seedKv(STORAGE_KEYS.COMPACT_HEADER, "true");
    renderApp();
    expect(screen.queryByText("Board")).not.toBeInTheDocument();
    expect(screen.queryByText("List")).not.toBeInTheDocument();
    expect(screen.queryByText("Calendar")).not.toBeInTheDocument();
    expect(screen.queryByText("Settings")).not.toBeInTheDocument();
    expect(screen.queryByText("Analytics")).not.toBeInTheDocument();
  });

  it("still shows icon buttons with aria labels when compact", () => {
    seedKv(STORAGE_KEYS.COMPACT_HEADER, "true");
    renderApp();
    expect(
      screen.getByRole("radio", { name: /board view/i }),
    ).toBeInTheDocument();
    expect(screen.getByLabelText("Open settings")).toBeInTheDocument();
    expect(screen.getByLabelText("Open analytics")).toBeInTheDocument();
  });

  it("can be toggled via settings modal", async () => {
    renderApp();
    const user = userEvent.setup();

    // Open settings
    await user.click(screen.getByLabelText("Open settings"));

    // Expand Appearance section if collapsed
    const appearanceButton = screen.getByRole("button", {
      name: /appearance/i,
    });
    await user.click(appearanceButton);

    // Toggle compact header
    const toggle = screen.getByRole("switch", { name: /compact header/i });
    await user.click(toggle);

    expect(kvGet(STORAGE_KEYS.COMPACT_HEADER, "false")).toBe("true");
  });

  it("defaults to false with labels visible", () => {
    renderApp();
    // Labels should be visible by default
    expect(screen.getByText("Settings")).toBeInTheDocument();
    expect(screen.getByText("Board")).toBeInTheDocument();
  });
});
