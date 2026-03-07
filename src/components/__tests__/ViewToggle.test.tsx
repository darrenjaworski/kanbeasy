import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../../constants/storage";
import type { Column } from "../../board/types";
import { renderApp } from "../../test/renderApp";

function seedBoard(columns: Column[]) {
  localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns }));
}

function makeColumnWithCard(): Column {
  const now = Date.now();
  return {
    id: "c1",
    title: "Todo",
    createdAt: now,
    updatedAt: now,
    cards: [
      {
        id: "card-1",
        number: 1,
        title: "Task",
        description: "",
        ticketTypeId: null,
        dueDate: null,
        createdAt: now,
        updatedAt: now,
        columnHistory: [{ columnId: "c1", enteredAt: now }],
      },
    ],
  };
}

describe("ViewToggle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders board, list, and calendar radio buttons", () => {
    seedBoard([makeColumnWithCard()]);
    renderApp();
    expect(
      screen.getByRole("radio", { name: /board view/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /list view/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /calendar view/i }),
    ).toBeInTheDocument();
  });

  it("defaults to board view checked", () => {
    seedBoard([makeColumnWithCard()]);
    renderApp();
    expect(screen.getByRole("radio", { name: /board view/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: /list view/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("toggles to list view on click", async () => {
    seedBoard([makeColumnWithCard()]);
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("radio", { name: /list view/i }));
    expect(screen.getByRole("radio", { name: /list view/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: /board view/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("persists preference to localStorage", async () => {
    seedBoard([makeColumnWithCard()]);
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("radio", { name: /list view/i }));
    expect(localStorage.getItem(STORAGE_KEYS.VIEW_MODE)).toBe("list");
  });

  it("toggles to calendar view on click", async () => {
    seedBoard([makeColumnWithCard()]);
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("radio", { name: /calendar view/i }));
    expect(
      screen.getByRole("radio", { name: /calendar view/i }),
    ).toHaveAttribute("aria-checked", "true");
    expect(screen.getByRole("radio", { name: /board view/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("persists calendar preference to localStorage", async () => {
    seedBoard([makeColumnWithCard()]);
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("radio", { name: /calendar view/i }));
    expect(localStorage.getItem(STORAGE_KEYS.VIEW_MODE)).toBe("calendar");
  });

  it("disables list and calendar views when there are no cards", () => {
    const now = Date.now();
    seedBoard([
      { id: "c1", title: "Empty", cards: [], createdAt: now, updatedAt: now },
    ]);
    renderApp();
    expect(screen.getByRole("radio", { name: /list view/i })).toBeDisabled();
    expect(
      screen.getByRole("radio", { name: /calendar view/i }),
    ).toBeDisabled();
  });
});
