import "@testing-library/jest-dom";
import * as React from "react";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Column } from "../Column";
import { BoardContext } from "../../../board/BoardContext";
import { ThemeContext } from "../../../theme/ThemeContext";
import { ClipboardContext } from "../../../board/ClipboardContext";
import type { Card } from "../../../board/types";
import type { ClipboardContextValue } from "../../../board/ClipboardContext";
import { makeCard } from "../../../test/builders";
import {
  makeBoardContext,
  makeThemeContext,
  makeClipboardContext,
} from "../../../test/renderWithProviders";

// ---------------------------------------------------------------------------
// Mock CardList to avoid @dnd-kit dependency
// ---------------------------------------------------------------------------

vi.mock("../CardList", () => ({
  CardList: (props: { cards: Card[]; columnId: string; density: string }) => (
    <div
      data-testid="stub-card-list"
      data-column-id={props.columnId}
      data-density={props.density}
      data-card-count={props.cards.length}
    />
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

type RenderColumnOptions = {
  props?: Partial<React.ComponentProps<typeof Column>>;
  board?: Parameters<typeof makeBoardContext>[0];
  theme?: Parameters<typeof makeThemeContext>[0];
  clipboard?: Partial<ClipboardContextValue>;
};

function renderColumn(opts: RenderColumnOptions = {}) {
  const boardCtx = makeBoardContext({
    addColumn: vi.fn(),
    updateColumn: vi.fn(),
    removeColumn: vi.fn(),
    addCard: vi.fn(() => "new-card-id"),
    removeCard: vi.fn(),
    updateCard: vi.fn(),
    setColumns: vi.fn(),
    sortCards: vi.fn(),
    reorderCard: vi.fn(),
    moveCard: vi.fn(),
    duplicateCard: vi.fn(() => "dup-id"),
    renameTicketType: vi.fn(),
    clearTicketType: vi.fn(),
    archiveCard: vi.fn(),
    restoreCard: vi.fn(),
    restoreCards: vi.fn(),
    permanentlyDeleteCard: vi.fn(),
    permanentlyDeleteCards: vi.fn(),
    clearArchive: vi.fn(),
    resetBoard: vi.fn(),
    setNextCardNumber: vi.fn(),
    setSearchQuery: vi.fn(),
    undo: vi.fn(),
    redo: vi.fn(),
    ...opts.board,
  });
  const themeCtx = makeThemeContext(opts.theme);
  const clipCtx = makeClipboardContext({
    copyCard: vi.fn(),
    pasteCard: vi.fn(() => null),
    ...opts.clipboard,
  });

  const defaultProps = {
    id: "col-1",
    title: "To Do",
    cards: [] as Card[],
    index: 0,
    columnCount: 3,
  };

  const result = render(
    <BoardContext.Provider value={boardCtx}>
      <ThemeContext.Provider value={themeCtx}>
        <ClipboardContext.Provider value={clipCtx}>
          <Column {...defaultProps} {...opts.props} />
        </ClipboardContext.Provider>
      </ThemeContext.Provider>
    </BoardContext.Provider>,
  );

  return { ...result, boardCtx, themeCtx, clipCtx };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Column", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it("has aria-label matching the column title", () => {
    renderColumn({ props: { title: "In Progress" } });
    expect(
      screen.getByRole("region", { name: "In Progress" }),
    ).toBeInTheDocument();
  });

  it("renders the title in the input", () => {
    renderColumn({ props: { title: "Done" } });
    expect(screen.getByLabelText("Column title")).toHaveValue("Done");
  });

  it("renders 'Add card' button with column name in aria-label", () => {
    renderColumn({ props: { title: "Backlog" } });
    expect(
      screen.getByRole("button", { name: "Add card to Backlog" }),
    ).toBeInTheDocument();
  });

  // --- Card count badge ---

  it("shows correct card count and singular label", () => {
    const cards = [makeCard({ id: "c1", title: "One" })];
    renderColumn({ props: { cards } });
    expect(screen.getByLabelText("1 card")).toHaveTextContent("1");
  });

  it("shows correct card count and plural label", () => {
    const cards = [
      makeCard({ id: "c1", title: "One" }),
      makeCard({ id: "c2", title: "Two" }),
    ];
    renderColumn({ props: { cards } });
    expect(screen.getByLabelText("2 cards")).toHaveTextContent("2");
  });

  // --- Drag handle ---

  it("shows drag handle when canDrag is true", () => {
    renderColumn({ props: { canDrag: true } });
    expect(
      screen.getByRole("button", { name: /Drag column/ }),
    ).toBeInTheDocument();
  });

  it("hides drag handle when canDrag is false", () => {
    renderColumn({ props: { canDrag: false } });
    expect(
      screen.queryByRole("button", { name: /Drag column/ }),
    ).not.toBeInTheDocument();
  });

  // --- Delete column ---

  it("calls removeColumn directly when column has no cards", async () => {
    const { boardCtx } = renderColumn({ props: { cards: [] } });
    const deleteBtn = screen.getByRole("button", { name: /Remove column/ });
    await userEvent.click(deleteBtn);
    expect(boardCtx.removeColumn).toHaveBeenCalledWith("col-1");
  });

  it("shows confirmation dialog when cards exist and warning is enabled", async () => {
    const cards = [
      makeCard({ id: "c1", title: "One" }),
      makeCard({ id: "c2", title: "Two" }),
    ];
    renderColumn({
      props: { cards },
      theme: { deleteColumnWarningEnabled: true },
    });
    const deleteBtn = screen.getByRole("button", { name: /Remove column/ });
    await userEvent.click(deleteBtn);
    expect(screen.getByText("Remove column?")).toBeInTheDocument();
    expect(screen.getByText(/This column has 2 cards/)).toBeInTheDocument();
  });

  it("skips confirmation when warning is disabled even with cards", async () => {
    const cards = [makeCard({ id: "c1", title: "One" })];
    const { boardCtx } = renderColumn({
      props: { cards },
      theme: { deleteColumnWarningEnabled: false },
    });
    const deleteBtn = screen.getByRole("button", { name: /Remove column/ });
    await userEvent.click(deleteBtn);
    expect(boardCtx.removeColumn).toHaveBeenCalledWith("col-1");
    expect(screen.queryByText("Remove column?")).not.toBeInTheDocument();
  });

  // --- Confirmation dialog ---

  it("calls removeColumn when confirm is clicked", async () => {
    const cards = [makeCard({ id: "c1", title: "One" })];
    const { boardCtx } = renderColumn({ props: { cards } });
    await userEvent.click(
      screen.getByRole("button", { name: /Remove column/ }),
    );
    await userEvent.click(screen.getByTestId("confirm-delete-button"));
    expect(boardCtx.removeColumn).toHaveBeenCalledWith("col-1");
  });

  it("does not call removeColumn when cancel is clicked", async () => {
    const cards = [makeCard({ id: "c1", title: "One" })];
    const { boardCtx } = renderColumn({ props: { cards } });
    await userEvent.click(
      screen.getByRole("button", { name: /Remove column/ }),
    );
    await userEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(boardCtx.removeColumn).not.toHaveBeenCalled();
  });

  it("shows singular message for 1 card", async () => {
    const cards = [makeCard({ id: "c1", title: "One" })];
    renderColumn({ props: { cards } });
    await userEvent.click(
      screen.getByRole("button", { name: /Remove column/ }),
    );
    expect(screen.getByText(/This column has 1 card\./)).toBeInTheDocument();
  });

  // --- Add card ---

  it("calls addCard with column id on button click", async () => {
    const { boardCtx } = renderColumn();
    await userEvent.click(screen.getByRole("button", { name: /Add card to/ }));
    expect(boardCtx.addCard).toHaveBeenCalledWith("col-1", "New card", null);
  });

  // --- Paste card ---

  it("hides paste button when no copied card", () => {
    renderColumn({ clipboard: { copiedCard: null } });
    expect(
      screen.queryByRole("button", { name: /Paste card/ }),
    ).not.toBeInTheDocument();
  });

  it("shows paste button when a card is copied", () => {
    renderColumn({
      clipboard: {
        copiedCard: {
          title: "Copied",
          description: "",
          ticketTypeId: null,
        },
      },
    });
    expect(
      screen.getByRole("button", { name: /Paste card/ }),
    ).toBeInTheDocument();
  });

  it("calls pasteCard with column id on paste button click", async () => {
    const { clipCtx } = renderColumn({
      clipboard: {
        copiedCard: {
          title: "Copied",
          description: "",
          ticketTypeId: null,
        },
        pasteCard: vi.fn(() => "pasted-id"),
      },
    });
    await userEvent.click(screen.getByRole("button", { name: /Paste card/ }));
    expect(clipCtx.pasteCard).toHaveBeenCalledWith("col-1");
  });

  it("changes add button text to '+ New' when a card is copied", () => {
    renderColumn({
      clipboard: {
        copiedCard: {
          title: "Copied",
          description: "",
          ticketTypeId: null,
        },
      },
    });
    expect(
      screen.getByRole("button", { name: /Add card to/ }),
    ).toHaveTextContent("+ New");
  });

  // --- Inline title editing ---

  it("saves title on blur", async () => {
    const { boardCtx } = renderColumn({ props: { title: "Old Title" } });
    const input = screen.getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "New Title");
    fireEvent.blur(input);
    expect(boardCtx.updateColumn).toHaveBeenCalledWith("col-1", "New Title");
  });

  it("saves title on Enter", async () => {
    const { boardCtx } = renderColumn({ props: { title: "Old" } });
    const input = screen.getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "Updated{Enter}");
    expect(boardCtx.updateColumn).toHaveBeenCalledWith("col-1", "Updated");
  });

  it("reverts title on Escape", async () => {
    renderColumn({ props: { title: "Original" } });
    const input = screen.getByLabelText("Column title");
    await userEvent.clear(input);
    await userEvent.type(input, "Changed{Escape}");
    expect(input).toHaveValue("Original");
  });

  // --- Resize handle ---

  it("hides resize handle when columnResizingEnabled is false", () => {
    renderColumn({ theme: { columnResizingEnabled: false } });
    expect(screen.queryByLabelText("Resize column")).not.toBeInTheDocument();
  });

  it("shows resize handle when columnResizingEnabled is true", () => {
    renderColumn({ theme: { columnResizingEnabled: true } });
    expect(screen.getByLabelText("Resize column")).toBeInTheDocument();
  });

  // --- Overlay mode ---

  it("applies backdrop-blur styling in overlay mode", () => {
    renderColumn({ props: { overlayMode: true } });
    const section = screen.getByRole("region");
    expect(section.className).toContain("backdrop-blur");
  });

  it("does not apply backdrop-blur in normal mode", () => {
    renderColumn({ props: { overlayMode: false } });
    const section = screen.getByRole("region");
    expect(section.className).not.toContain("backdrop-blur-md");
  });
});
