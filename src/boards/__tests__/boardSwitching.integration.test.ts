import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { BoardsProvider } from "../BoardsProvider";
import { BoardProvider } from "../../board/BoardProvider";
import { useBoards } from "../useBoards";
import { useBoard } from "../../board/useBoard";
import { boardStorageKey } from "../../constants/storage";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(
    BoardsProvider,
    null,
    createElement(BoardProvider, null, children),
  );
}

describe("board switching integration", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("new board starts with default columns", () => {
    const { result } = renderHook(
      () => ({ boards: useBoards(), board: useBoard() }),
      { wrapper },
    );

    // Default board has 3 columns
    expect(result.current.board.columns).toHaveLength(3);
  });

  it("switching boards loads the correct data", () => {
    // Seed two boards with different data
    const board1Data = {
      columns: [
        {
          id: "col-a",
          title: "Board 1 Column",
          cards: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      archive: [],
    };
    const board2Data = {
      columns: [
        {
          id: "col-b",
          title: "Board 2 Column",
          cards: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
        {
          id: "col-c",
          title: "Board 2 Column 2",
          cards: [],
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ],
      archive: [],
    };

    localStorage.setItem(
      boardStorageKey("board-a"),
      JSON.stringify(board1Data),
    );
    localStorage.setItem(
      boardStorageKey("board-b"),
      JSON.stringify(board2Data),
    );

    const index = {
      boards: [
        {
          id: "board-a",
          title: "First",
          createdAt: "2025-01-01",
          updatedAt: "2025-01-01",
        },
        {
          id: "board-b",
          title: "Second",
          createdAt: "2025-01-02",
          updatedAt: "2025-01-02",
        },
      ],
      activeBoardId: "board-a",
      nextCardNumber: 1,
    };
    localStorage.setItem("kanbeasy:boardIndex", JSON.stringify(index));

    const { result } = renderHook(
      () => ({ boards: useBoards(), board: useBoard() }),
      { wrapper },
    );

    // Should load board-a data
    expect(result.current.board.columns).toHaveLength(1);
    expect(result.current.board.columns[0].title).toBe("Board 1 Column");

    // Switch to board-b
    act(() => {
      result.current.boards.switchBoard("board-b");
    });

    expect(result.current.board.columns).toHaveLength(2);
    expect(result.current.board.columns[0].title).toBe("Board 2 Column");
  });

  it("mutations on one board do not affect another", () => {
    const { result } = renderHook(
      () => ({ boards: useBoards(), board: useBoard() }),
      { wrapper },
    );

    // Add a column to the default board
    act(() => {
      result.current.board.addColumn("Extra Column");
    });
    const defaultColumnCount = result.current.board.columns.length;

    // Create a new board (which auto-switches)
    act(() => {
      result.current.boards.createBoard("Second Board");
    });

    // New board should have default 3 columns, not affected by default board
    expect(result.current.board.columns).toHaveLength(3);

    // Switch back to default board
    act(() => {
      result.current.boards.switchBoard("default");
    });

    expect(result.current.board.columns).toHaveLength(defaultColumnCount);
  });

  it("undo/redo history resets when switching boards", () => {
    const { result } = renderHook(
      () => ({ boards: useBoards(), board: useBoard() }),
      { wrapper },
    );

    // Make a change so we have undo history
    act(() => {
      result.current.board.addColumn("New Column");
    });
    expect(result.current.board.canUndo).toBe(true);

    // Create and switch to a new board
    act(() => {
      result.current.boards.createBoard("Second");
    });

    // Undo history should be cleared
    expect(result.current.board.canUndo).toBe(false);
    expect(result.current.board.canRedo).toBe(false);
  });

  it("persists board data to the correct storage key", () => {
    const { result } = renderHook(
      () => ({ boards: useBoards(), board: useBoard() }),
      { wrapper },
    );

    act(() => {
      result.current.board.addColumn("Test Column");
    });

    const stored = JSON.parse(
      localStorage.getItem(boardStorageKey("default")) ?? "{}",
    );
    expect(
      stored.columns.some((c: { title: string }) => c.title === "Test Column"),
    ).toBe(true);
  });
});
