import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CommandPalette } from "../CommandPalette";
import { makeColumn, makeCard } from "../../test/builders";
import {
  makeBoardContext,
  makeThemeContext,
} from "../../test/renderWithProviders";
import { BoardContext } from "../../board/BoardContext";
import { ThemeContext } from "../../theme/ThemeContext";
import type { BoardContextValue } from "../../board/types";
import type { ThemeContextValue } from "../../theme/types";
import type { ReactNode } from "react";

function renderPalette(
  open: boolean,
  onClose = vi.fn(),
  boardOverrides: Partial<BoardContextValue> = {},
  themeOverrides: Partial<ThemeContextValue> = {},
) {
  const board = makeBoardContext(boardOverrides);
  const theme = makeThemeContext(themeOverrides);
  const Wrapper = ({ children }: { children: ReactNode }) => (
    <BoardContext.Provider value={board}>
      <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
    </BoardContext.Provider>
  );
  return {
    ...render(<CommandPalette open={open} onClose={onClose} />, {
      wrapper: Wrapper,
    }),
    board,
    theme,
    onClose,
  };
}

describe("CommandPalette", () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it("renders nothing when closed", () => {
    renderPalette(false);
    expect(screen.queryByTestId("command-palette")).not.toBeInTheDocument();
  });

  it("renders the command palette when open", () => {
    renderPalette(true);
    expect(screen.getByTestId("command-palette")).toBeInTheDocument();
    expect(screen.getByTestId("command-palette-input")).toBeInTheDocument();
  });

  it("shows all enabled actions", () => {
    const col = makeColumn({ id: "col-1", title: "To Do" });
    renderPalette(true, vi.fn(), { columns: [col] });
    expect(screen.getByTestId("command-add-card")).toBeInTheDocument();
    expect(screen.getByTestId("command-add-column")).toBeInTheDocument();
    expect(screen.getByTestId("command-open-settings")).toBeInTheDocument();
  });

  it("disables add card when no columns exist", () => {
    renderPalette(true, vi.fn(), { columns: [] });
    expect(screen.queryByTestId("command-add-card")).not.toBeInTheDocument();
  });

  it("filters actions by search query", async () => {
    const user = userEvent.setup();
    const col = makeColumn({ id: "col-1" });
    renderPalette(true, vi.fn(), { columns: [col] });

    const input = screen.getByTestId("command-palette-input");
    await user.type(input, "settings");

    expect(screen.getByTestId("command-open-settings")).toBeInTheDocument();
    expect(screen.queryByTestId("command-add-card")).not.toBeInTheDocument();
    expect(screen.queryByTestId("command-add-column")).not.toBeInTheDocument();
  });

  it("shows no matching commands message", async () => {
    const user = userEvent.setup();
    renderPalette(true);

    const input = screen.getByTestId("command-palette-input");
    await user.type(input, "xyznonexistent");

    expect(screen.getByText("No matching commands")).toBeInTheDocument();
  });

  it("calls onClose when backdrop is clicked", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderPalette(true, onClose);

    await user.click(screen.getByTestId("command-palette-backdrop"));
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("calls onClose when Escape is pressed", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    renderPalette(true, onClose);

    const input = screen.getByTestId("command-palette-input");
    await user.click(input);
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("selects add-card action and calls addCard on first column", async () => {
    const user = userEvent.setup();
    const addCard = vi.fn().mockReturnValue("new-id");
    const col = makeColumn({
      id: "col-1",
      title: "To Do",
      cards: [makeCard({ id: "c1" })],
    });
    const onClose = vi.fn();
    renderPalette(true, onClose, { columns: [col], addCard });

    await user.click(screen.getByTestId("command-add-card"));

    expect(addCard).toHaveBeenCalledWith(
      "col-1",
      "New card",
      null,
      undefined,
      undefined,
    );
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("selects add-column action and calls addColumn", async () => {
    const user = userEvent.setup();
    const addColumn = vi.fn();
    const onClose = vi.fn();
    renderPalette(true, onClose, { addColumn });

    await user.click(screen.getByTestId("command-add-column"));

    expect(addColumn).toHaveBeenCalledWith("New Column");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("navigates with arrow keys and selects with Enter", async () => {
    const user = userEvent.setup();
    const addColumn = vi.fn();
    const col = makeColumn({ id: "col-1" });
    const onClose = vi.fn();
    renderPalette(true, onClose, { columns: [col], addColumn });

    const input = screen.getByTestId("command-palette-input");
    await user.click(input);
    // Arrow down to "Add column" (second item), then Enter
    await user.keyboard("{ArrowDown}{Enter}");

    expect(addColumn).toHaveBeenCalledWith("New Column");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("switches view mode via command", async () => {
    const user = userEvent.setup();
    const setViewMode = vi.fn();
    const col = makeColumn({
      id: "col-1",
      cards: [makeCard({ id: "c1" })],
    });
    const onClose = vi.fn();
    renderPalette(true, onClose, { columns: [col] }, { setViewMode });

    await user.click(screen.getByTestId("command-view-list"));

    expect(setViewMode).toHaveBeenCalledWith("list");
    expect(onClose).toHaveBeenCalledOnce();
  });

  it("uses default card type when adding a card", async () => {
    const user = userEvent.setup();
    const addCard = vi.fn().mockReturnValue("new-id");
    const col = makeColumn({ id: "col-1" });
    const onClose = vi.fn();
    renderPalette(
      true,
      onClose,
      { columns: [col], addCard },
      {
        defaultCardTypeId: "feat",
        cardTypes: [{ id: "feat", label: "Feature", color: "#3b82f6" }],
      },
    );

    await user.click(screen.getByTestId("command-add-card"));

    expect(addCard).toHaveBeenCalledWith(
      "col-1",
      "New card",
      "feat",
      "Feature",
      "#3b82f6",
    );
  });

  it("highlights selected item on mouse enter", async () => {
    const user = userEvent.setup();
    const col = makeColumn({ id: "col-1" });
    renderPalette(true, vi.fn(), { columns: [col] });

    const addColumn = screen.getByTestId("command-add-column");
    await user.hover(addColumn);

    expect(addColumn).toHaveAttribute("aria-selected", "true");
  });

  it("does not show shortcut hint for add card", () => {
    const col = makeColumn({ id: "col-1" });
    renderPalette(true, vi.fn(), { columns: [col] });

    const addCardItem = screen.getByTestId("command-add-card");
    expect(addCardItem.querySelector("kbd")).toBeNull();
  });

  it("hides current view mode from actions", () => {
    const col = makeColumn({ id: "col-1", cards: [makeCard({ id: "c1" })] });
    renderPalette(true, vi.fn(), { columns: [col] }, { viewMode: "board" });

    // Board is current, so it should be disabled (hidden from filtered list)
    expect(screen.queryByTestId("command-view-board")).not.toBeInTheDocument();
    expect(screen.getByTestId("command-view-list")).toBeInTheDocument();
  });

  it("disables focus search when no cards exist", () => {
    renderPalette(true, vi.fn(), { columns: [] });
    expect(
      screen.queryByTestId("command-focus-search"),
    ).not.toBeInTheDocument();
  });

  it("disables list view when no cards exist", () => {
    const col = makeColumn({ id: "col-1", cards: [] });
    renderPalette(true, vi.fn(), { columns: [col] });
    expect(screen.queryByTestId("command-view-list")).not.toBeInTheDocument();
  });

  it("disables calendar view when no due dates exist", () => {
    const col = makeColumn({
      id: "col-1",
      cards: [makeCard({ id: "c1" })],
    });
    renderPalette(true, vi.fn(), { columns: [col] });
    expect(
      screen.queryByTestId("command-view-calendar"),
    ).not.toBeInTheDocument();
  });

  it("enables calendar view when due dates exist", () => {
    const col = makeColumn({
      id: "col-1",
      cards: [makeCard({ id: "c1", dueDate: "2025-06-15" })],
    });
    renderPalette(true, vi.fn(), { columns: [col] }, { viewMode: "board" });
    expect(screen.getByTestId("command-view-calendar")).toBeInTheDocument();
  });

  it("wraps selection around with ArrowUp from first item", async () => {
    const user = userEvent.setup();
    const col = makeColumn({ id: "col-1" });
    renderPalette(true, vi.fn(), { columns: [col] });

    const input = screen.getByTestId("command-palette-input");
    await user.click(input);
    // ArrowUp from first item should wrap to last item
    await user.keyboard("{ArrowUp}");

    const items = screen.getAllByRole("option");
    const lastItem = items[items.length - 1];
    expect(lastItem).toHaveAttribute("aria-selected", "true");
  });

  it("resets selection when query changes", async () => {
    const user = userEvent.setup();
    const col = makeColumn({ id: "col-1" });
    renderPalette(true, vi.fn(), { columns: [col] });

    const input = screen.getByTestId("command-palette-input");
    await user.click(input);
    await user.keyboard("{ArrowDown}{ArrowDown}");

    // Type to filter — selection should reset to 0
    await user.type(input, "add");
    const items = screen.getAllByRole("option");
    expect(items[0]).toHaveAttribute("aria-selected", "true");
  });

  it("opens settings via header button click", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();

    // Add a button with the aria-label the command palette looks for
    const settingsButton = document.createElement("button");
    settingsButton.setAttribute("aria-label", "Open settings");
    const clicked = vi.fn();
    settingsButton.addEventListener("click", clicked);
    document.body.appendChild(settingsButton);

    renderPalette(true, onClose);
    await user.click(screen.getByTestId("command-open-settings"));

    expect(clicked).toHaveBeenCalledOnce();
    expect(onClose).toHaveBeenCalledOnce();
    document.body.removeChild(settingsButton);
  });
});
