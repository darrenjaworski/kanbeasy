import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { BoardsProvider } from "../BoardsProvider";
import { useBoards } from "../useBoards";
import { STORAGE_KEYS, boardStorageKey } from "../../constants/storage";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(BoardsProvider, null, children);
}

describe("BoardsProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  describe("initialization", () => {
    it("creates a default board for new users", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      expect(result.current.boards).toHaveLength(1);
      expect(result.current.boards[0].id).toBe("default");
      expect(result.current.boards[0].title).toBe("My Board");
      expect(result.current.activeBoardId).toBe("default");
    });

    it("persists the board index to localStorage", () => {
      renderHook(() => useBoards(), { wrapper });

      const stored = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.BOARD_INDEX) ?? "{}",
      );
      expect(stored.boards).toHaveLength(1);
      expect(stored.activeBoardId).toBe("default");
    });

    it("loads existing board index from localStorage", () => {
      const index = {
        boards: [
          {
            id: "board-1",
            title: "Work",
            createdAt: "2025-01-01",
            updatedAt: "2025-01-01",
          },
          {
            id: "board-2",
            title: "Personal",
            createdAt: "2025-01-02",
            updatedAt: "2025-01-02",
          },
        ],
        activeBoardId: "board-2",
        nextCardNumber: 10,
      };
      localStorage.setItem(STORAGE_KEYS.BOARD_INDEX, JSON.stringify(index));

      const { result } = renderHook(() => useBoards(), { wrapper });

      expect(result.current.boards).toHaveLength(2);
      expect(result.current.activeBoardId).toBe("board-2");
    });
  });

  describe("migration from single-board", () => {
    it("migrates existing kanbeasy:board data to kanbeasy:board:default", () => {
      const boardData = JSON.stringify({
        columns: [{ id: "col-1", title: "Todo", cards: [] }],
      });
      localStorage.setItem(STORAGE_KEYS.BOARD, boardData);
      localStorage.setItem(STORAGE_KEYS.NEXT_CARD_NUMBER, "7");

      renderHook(() => useBoards(), { wrapper });

      // Old key should be removed
      expect(localStorage.getItem(STORAGE_KEYS.BOARD)).toBeNull();
      expect(localStorage.getItem(STORAGE_KEYS.NEXT_CARD_NUMBER)).toBeNull();

      // Data should be at the new key
      expect(localStorage.getItem(boardStorageKey("default"))).toBe(boardData);

      // Board index should be created
      const index = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.BOARD_INDEX) ?? "{}",
      );
      expect(index.boards).toHaveLength(1);
      expect(index.boards[0].id).toBe("default");
      expect(index.boards[0].title).toBe("My Board");
      expect(index.nextCardNumber).toBe(7);
    });

    it("migrates with zero card counter when none exists", () => {
      localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));

      renderHook(() => useBoards(), { wrapper });

      const index = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.BOARD_INDEX) ?? "{}",
      );
      expect(index.nextCardNumber).toBe(0);
    });
  });

  describe("createBoard", () => {
    it("creates a new board and switches to it", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      let newId: string;
      act(() => {
        newId = result.current.createBoard("Work Board");
      });

      expect(result.current.boards).toHaveLength(2);
      expect(result.current.boards[1].title).toBe("Work Board");
      expect(result.current.activeBoardId).toBe(newId!);
    });

    it("assigns timestamps to new boards", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      act(() => {
        result.current.createBoard("New Board");
      });

      const newBoard = result.current.boards[1];
      expect(newBoard.createdAt).toBeTruthy();
      expect(newBoard.updatedAt).toBeTruthy();
    });
  });

  describe("deleteBoard", () => {
    it("deletes a board and removes its localStorage data", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      let boardId: string;
      act(() => {
        boardId = result.current.createBoard("To Delete");
      });

      // Set some data for that board
      localStorage.setItem(
        boardStorageKey(boardId!),
        JSON.stringify({ columns: [] }),
      );

      act(() => {
        result.current.deleteBoard(boardId!);
      });

      expect(result.current.boards).toHaveLength(1);
      expect(localStorage.getItem(boardStorageKey(boardId!))).toBeNull();
    });

    it("cannot delete the last remaining board", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      expect(result.current.boards).toHaveLength(1);

      act(() => {
        result.current.deleteBoard(result.current.boards[0].id);
      });

      expect(result.current.boards).toHaveLength(1);
    });

    it("switches to first remaining board when deleting the active board", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      act(() => {
        result.current.createBoard("Second");
      });
      act(() => {
        result.current.createBoard("Third");
      });

      // Active is now "Third" (the last created)
      const thirdId = result.current.activeBoardId;

      act(() => {
        result.current.deleteBoard(thirdId);
      });

      // Should switch to first board
      expect(result.current.activeBoardId).toBe(result.current.boards[0].id);
    });

    it("does not switch when deleting a non-active board", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      let secondId: string;
      act(() => {
        secondId = result.current.createBoard("Second");
      });

      // Switch back to first
      act(() => {
        result.current.switchBoard(result.current.boards[0].id);
      });

      const activeBeforeDelete = result.current.activeBoardId;

      act(() => {
        result.current.deleteBoard(secondId!);
      });

      expect(result.current.activeBoardId).toBe(activeBeforeDelete);
    });
  });

  describe("renameBoard", () => {
    it("renames a board and updates its title", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      act(() => {
        result.current.renameBoard("default", "Renamed Board");
      });

      expect(result.current.boards[0].title).toBe("Renamed Board");
      expect(result.current.boards[0].updatedAt).toBeTruthy();
    });
  });

  describe("switchBoard", () => {
    it("changes the active board ID", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      let secondId: string;
      act(() => {
        secondId = result.current.createBoard("Second");
      });
      act(() => {
        result.current.switchBoard("default");
      });

      expect(result.current.activeBoardId).toBe("default");

      act(() => {
        result.current.switchBoard(secondId!);
      });

      expect(result.current.activeBoardId).toBe(secondId!);
    });
  });

  describe("duplicateBoard", () => {
    it("copies board data and inserts after the source", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      // Store data for the default board
      const boardData = JSON.stringify({
        columns: [{ id: "c1", title: "Col", cards: [] }],
      });
      localStorage.setItem(boardStorageKey("default"), boardData);

      let dupId: string;
      act(() => {
        dupId = result.current.duplicateBoard("default", "Copy of My Board");
      });

      expect(result.current.boards).toHaveLength(2);
      expect(result.current.boards[1].title).toBe("Copy of My Board");
      expect(result.current.activeBoardId).toBe(dupId!);

      // Board data should be copied
      expect(localStorage.getItem(boardStorageKey(dupId!))).toBe(boardData);
    });

    it("inserts duplicate after the source board", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      act(() => {
        result.current.createBoard("Second");
      });
      act(() => {
        result.current.createBoard("Third");
      });

      // Duplicate the first board
      act(() => {
        result.current.duplicateBoard("default", "Default Copy");
      });

      // "Default Copy" should be at index 1 (right after "default")
      expect(result.current.boards[0].id).toBe("default");
      expect(result.current.boards[1].title).toBe("Default Copy");
    });
  });

  describe("setNextCardNumber", () => {
    it("persists the card counter to the board index", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      act(() => {
        result.current.setNextCardNumber(42);
      });

      const index = JSON.parse(
        localStorage.getItem(STORAGE_KEYS.BOARD_INDEX) ?? "{}",
      );
      expect(index.nextCardNumber).toBe(42);
    });

    it("updates the context value reactively", () => {
      const { result } = renderHook(() => useBoards(), { wrapper });

      expect(result.current.nextCardNumber).toBe(0);

      act(() => {
        result.current.setNextCardNumber(10);
      });

      expect(result.current.nextCardNumber).toBe(10);
    });
  });

  describe("useBoards hook", () => {
    it("throws when used outside BoardsProvider", () => {
      expect(() => renderHook(() => useBoards())).toThrow(
        "useBoards must be used within a BoardsProvider",
      );
    });
  });
});
