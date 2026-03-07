import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BoardTabs } from "../BoardTabs";
import { BoardsContext } from "../../boards/BoardsContext";
import type { BoardsContextValue } from "../../boards/types";

const noop = () => {};

function makeBoardsValue(
  overrides: Partial<BoardsContextValue> = {},
): BoardsContextValue {
  return {
    boards: [
      {
        id: "board-1",
        title: "Personal",
        createdAt: "2025-01-01",
        updatedAt: "2025-01-01",
      },
      {
        id: "board-2",
        title: "Work",
        createdAt: "2025-01-02",
        updatedAt: "2025-01-02",
      },
    ],
    activeBoardId: "board-1",
    nextCardNumber: 1,
    createBoard: () => "new-id",
    deleteBoard: noop,
    renameBoard: noop,
    switchBoard: noop,
    duplicateBoard: () => "dup-id",
    setNextCardNumber: noop,
    ...overrides,
  };
}

function renderTabs(overrides: Partial<BoardsContextValue> = {}) {
  const value = makeBoardsValue(overrides);
  return render(
    <BoardsContext.Provider value={value}>
      <BoardTabs />
    </BoardsContext.Provider>,
  );
}

describe("BoardTabs", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("rendering", () => {
    it("renders a tab for each board", () => {
      renderTabs();

      expect(screen.getByText("Personal")).toBeInTheDocument();
      expect(screen.getByText("Work")).toBeInTheDocument();
    });

    it("marks the active board tab with aria-current", () => {
      renderTabs();

      const personalTab = screen.getByTestId("board-tab-board-1");
      const workTab = screen.getByTestId("board-tab-board-2");

      expect(personalTab).toHaveAttribute("aria-current", "page");
      expect(workTab).not.toHaveAttribute("aria-current");
    });

    it("shows the create new board button", () => {
      renderTabs();

      expect(
        screen.getByRole("button", { name: "Create new board" }),
      ).toBeInTheDocument();
    });
  });

  describe("switching boards", () => {
    it("calls switchBoard when clicking a tab", async () => {
      const switchBoard = vi.fn();
      renderTabs({ switchBoard });

      await userEvent.click(screen.getByText("Work"));

      expect(switchBoard).toHaveBeenCalledWith("board-2");
    });
  });

  describe("creating boards", () => {
    it("shows an input when clicking the create button", async () => {
      renderTabs();

      await userEvent.click(
        screen.getByRole("button", { name: "Create new board" }),
      );

      expect(screen.getByPlaceholderText("Board name...")).toBeInTheDocument();
    });

    it("calls createBoard on Enter", async () => {
      const createBoard = vi.fn().mockReturnValue("new-id");
      renderTabs({ createBoard });

      await userEvent.click(
        screen.getByRole("button", { name: "Create new board" }),
      );
      const input = screen.getByPlaceholderText("Board name...");
      await userEvent.type(input, "New Board{enter}");

      expect(createBoard).toHaveBeenCalledWith("New Board");
    });

    it("does not create board with empty title", async () => {
      const createBoard = vi.fn().mockReturnValue("new-id");
      renderTabs({ createBoard });

      await userEvent.click(
        screen.getByRole("button", { name: "Create new board" }),
      );
      const input = screen.getByPlaceholderText("Board name...");
      await userEvent.type(input, "{enter}");

      expect(createBoard).not.toHaveBeenCalled();
    });

    it("cancels creation on Escape", async () => {
      renderTabs();

      await userEvent.click(
        screen.getByRole("button", { name: "Create new board" }),
      );
      expect(screen.getByPlaceholderText("Board name...")).toBeInTheDocument();

      await userEvent.keyboard("{Escape}");

      expect(
        screen.queryByPlaceholderText("Board name..."),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Create new board" }),
      ).toBeInTheDocument();
    });
  });

  describe("renaming boards", () => {
    it("shows an inline input on double-click", async () => {
      renderTabs();

      fireEvent.doubleClick(screen.getByTestId("board-tab-board-1"));

      const input = screen.getByDisplayValue("Personal");
      expect(input).toBeInTheDocument();
    });

    it("calls renameBoard on blur", async () => {
      const renameBoard = vi.fn();
      renderTabs({ renameBoard });

      fireEvent.doubleClick(screen.getByTestId("board-tab-board-1"));

      const input = screen.getByDisplayValue("Personal");
      await userEvent.clear(input);
      await userEvent.type(input, "Updated");
      fireEvent.blur(input);

      expect(renameBoard).toHaveBeenCalledWith("board-1", "Updated");
    });

    it("calls renameBoard on Enter", async () => {
      const renameBoard = vi.fn();
      renderTabs({ renameBoard });

      fireEvent.doubleClick(screen.getByTestId("board-tab-board-1"));

      const input = screen.getByDisplayValue("Personal");
      await userEvent.clear(input);
      await userEvent.type(input, "New Name{enter}");

      expect(renameBoard).toHaveBeenCalledWith("board-1", "New Name");
    });

    it("cancels rename on Escape", async () => {
      const renameBoard = vi.fn();
      renderTabs({ renameBoard });

      fireEvent.doubleClick(screen.getByTestId("board-tab-board-1"));

      await userEvent.keyboard("{Escape}");

      expect(renameBoard).not.toHaveBeenCalled();
      expect(screen.getByText("Personal")).toBeInTheDocument();
    });
  });

  describe("context menu", () => {
    it("shows context menu on right-click", () => {
      renderTabs();

      fireEvent.contextMenu(screen.getByTestId("board-tab-board-1"));

      expect(
        screen.getByRole("button", { name: "Rename" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Duplicate" }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole("button", { name: "Delete" }),
      ).toBeInTheDocument();
    });

    it("calls duplicateBoard from context menu", async () => {
      const duplicateBoard = vi.fn().mockReturnValue("dup-id");
      renderTabs({ duplicateBoard });

      fireEvent.contextMenu(screen.getByTestId("board-tab-board-1"));
      await userEvent.click(screen.getByRole("button", { name: "Duplicate" }));

      expect(duplicateBoard).toHaveBeenCalledWith("board-1", "Personal (copy)");
    });

    it("confirms before deleting from context menu", async () => {
      const deleteBoard = vi.fn();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(true);
      renderTabs({ deleteBoard });

      fireEvent.contextMenu(screen.getByTestId("board-tab-board-2"));
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      expect(confirmSpy).toHaveBeenCalled();
      expect(deleteBoard).toHaveBeenCalledWith("board-2");
      confirmSpy.mockRestore();
    });

    it("does not delete when confirm is cancelled", async () => {
      const deleteBoard = vi.fn();
      const confirmSpy = vi.spyOn(window, "confirm").mockReturnValue(false);
      renderTabs({ deleteBoard });

      fireEvent.contextMenu(screen.getByTestId("board-tab-board-2"));
      await userEvent.click(screen.getByRole("button", { name: "Delete" }));

      expect(deleteBoard).not.toHaveBeenCalled();
      confirmSpy.mockRestore();
    });

    it("hides delete option when only one board exists", () => {
      renderTabs({
        boards: [
          {
            id: "only",
            title: "Only Board",
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01",
          },
        ],
        activeBoardId: "only",
      });

      fireEvent.contextMenu(screen.getByTestId("board-tab-only"));

      expect(
        screen.getByRole("button", { name: "Rename" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Delete" }),
      ).not.toBeInTheDocument();
    });

    it("starts rename from context menu", async () => {
      renderTabs();

      fireEvent.contextMenu(screen.getByTestId("board-tab-board-1"));
      await userEvent.click(screen.getByRole("button", { name: "Rename" }));

      expect(screen.getByDisplayValue("Personal")).toBeInTheDocument();
    });

    it("closes context menu on outside click", () => {
      renderTabs();

      fireEvent.contextMenu(screen.getByTestId("board-tab-board-1"));
      expect(
        screen.getByRole("button", { name: "Rename" }),
      ).toBeInTheDocument();

      fireEvent.mouseDown(document.body);

      expect(
        screen.queryByRole("button", { name: "Rename" }),
      ).not.toBeInTheDocument();
    });
  });
});
