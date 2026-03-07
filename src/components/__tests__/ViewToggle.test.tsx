import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { STORAGE_KEYS } from "../../constants/storage";
import type { Column } from "../../board/types";
import { renderApp } from "../../test/renderApp";
import { makeCard, makeColumn, resetCardNumber } from "../../test/builders";

function seedBoard(columns: Column[]) {
  localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns }));
}

function makeColumnWithCard(): Column {
  const now = Date.now();
  return makeColumn({
    id: "c1",
    title: "Todo",
    cards: [
      makeCard({
        id: "card-1",
        number: 1,
        title: "Task",
        createdAt: now,
        updatedAt: now,
        columnHistory: [{ columnId: "c1", enteredAt: now }],
      }),
    ],
    createdAt: now,
    updatedAt: now,
  });
}

describe("ViewToggle", () => {
  beforeEach(() => {
    localStorage.clear();
    resetCardNumber();
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
    seedBoard([
      makeColumn({ id: "c1", title: "Empty", cards: [] }),
    ]);
    renderApp();
    expect(screen.getByRole("radio", { name: /list view/i })).toBeDisabled();
    expect(
      screen.getByRole("radio", { name: /calendar view/i }),
    ).toBeDisabled();
  });
});
