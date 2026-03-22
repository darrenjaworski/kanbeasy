import "@testing-library/jest-dom";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { renderApp } from "../../test/renderApp";
import { seedBoard as seedBoardDb, seedKv } from "../../utils/db";
import { makeCard, makeColumn, resetCardNumber } from "../../test/builders";
import { STORAGE_KEYS } from "../../constants/storage";

const TWO_CARD_TYPES = [
  { id: "feat", label: "Feature", color: "#22c55e" },
  { id: "fix", label: "Fix", color: "#ef4444" },
];

function seedBoardWithCards() {
  seedBoardDb({
    columns: [
      makeColumn({
        id: "c1",
        title: "Todo",
        cards: [makeCard({ id: "card-1", title: "Task" })],
      }),
    ],
    archive: [],
  });
}

function seedEmptyBoard() {
  seedBoardDb({
    columns: [makeColumn({ id: "c1", title: "Empty", cards: [] })],
    archive: [],
  });
}

describe("SearchInput — card type filter button", () => {
  beforeEach(() => {
    resetCardNumber();
  });

  it("filter button is disabled when no card types are configured", () => {
    seedBoardWithCards();
    // Use seedKv (writes directly to kvCache) so ThemeProvider sees "custom"
    // preset with no stored types — localStorage.setItem won't work here
    // because the IDB migration path only runs when the board is in localStorage.
    seedKv(STORAGE_KEYS.CARD_TYPE_PRESET, "custom");
    renderApp();
    expect(
      screen.getByRole("button", { name: /filter by card type/i }),
    ).toBeDisabled();
  });

  it("filter button is disabled when board has no cards (even with card types)", () => {
    seedEmptyBoard();
    seedKv(STORAGE_KEYS.CARD_TYPES, TWO_CARD_TYPES);
    renderApp();
    expect(
      screen.getByRole("button", { name: /filter by card type/i }),
    ).toBeDisabled();
  });

  it("filter button is enabled when card types exist and board has cards", () => {
    seedBoardWithCards();
    seedKv(STORAGE_KEYS.CARD_TYPES, TWO_CARD_TYPES);
    renderApp();
    expect(
      screen.getByRole("button", { name: /filter by card type/i }),
    ).not.toBeDisabled();
  });
});

describe("SearchInput — card type filter popover", () => {
  beforeEach(() => {
    resetCardNumber();
    seedBoardWithCards();
    seedKv(STORAGE_KEYS.CARD_TYPES, TWO_CARD_TYPES);
  });

  it("clicking the filter button opens the popover", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole("button", { name: /filter by card type/i }),
    );
    expect(screen.getByTestId("card-type-filter-popover")).toBeInTheDocument();
  });

  it("popover shows all configured card type options", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole("button", { name: /filter by card type/i }),
    );
    expect(
      screen.getByTestId("card-type-filter-option-feat"),
    ).toBeInTheDocument();
    expect(
      screen.getByTestId("card-type-filter-option-fix"),
    ).toBeInTheDocument();
  });

  it("clicking a type option checks its checkbox", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole("button", { name: /filter by card type/i }),
    );
    const option = screen.getByTestId("card-type-filter-option-feat");
    const checkbox = option.querySelector("input[type='checkbox']")!;
    expect(checkbox).not.toBeChecked();
    await user.click(option);
    expect(checkbox).toBeChecked();
  });

  it("clicking a checked type unchecks it (toggleType)", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole("button", { name: /filter by card type/i }),
    );
    const option = screen.getByTestId("card-type-filter-option-feat");
    await user.click(option);
    await user.click(option);
    expect(option.querySelector("input[type='checkbox']")).not.toBeChecked();
  });

  it("clear button appears when at least one type is selected", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole("button", { name: /filter by card type/i }),
    );
    expect(
      screen.queryByTestId("card-type-filter-clear"),
    ).not.toBeInTheDocument();
    await user.click(screen.getByTestId("card-type-filter-option-feat"));
    expect(screen.getByTestId("card-type-filter-clear")).toBeInTheDocument();
  });

  it("clicking Clear removes all selected types", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole("button", { name: /filter by card type/i }),
    );
    await user.click(screen.getByTestId("card-type-filter-option-feat"));
    await user.click(screen.getByTestId("card-type-filter-clear"));
    expect(
      screen.queryByTestId("card-type-filter-clear"),
    ).not.toBeInTheDocument();
    expect(
      screen
        .getByTestId("card-type-filter-option-feat")
        .querySelector("input[type='checkbox']"),
    ).not.toBeChecked();
  });

  it("mousedown outside the popover closes it (click-away handler)", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(
      screen.getByRole("button", { name: /filter by card type/i }),
    );
    expect(screen.getByTestId("card-type-filter-popover")).toBeInTheDocument();
    // Fire mousedown outside — the document listener closes the popover
    fireEvent.mouseDown(document.body);
    expect(
      screen.queryByTestId("card-type-filter-popover"),
    ).not.toBeInTheDocument();
  });
});
