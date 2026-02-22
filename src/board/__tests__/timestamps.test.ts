import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { BoardProvider } from "../BoardProvider";
import { useBoard } from "../useBoard";

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(BoardProvider, null, children);
}

describe("timestamps in BoardProvider", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const T0 = new Date("2025-06-15T12:00:00Z").getTime();
  const T1 = T0 + 1000;
  const T2 = T0 + 2000;

  describe("addColumn", () => {
    it("sets createdAt and updatedAt on new column", () => {
      const { result } = renderHook(() => useBoard(), { wrapper });

      act(() => {
        result.current.resetBoard();
      });

      vi.setSystemTime(new Date(T1));

      act(() => {
        result.current.addColumn("New Column");
      });

      const col = result.current.columns.find((c) => c.title === "New Column");
      expect(col).toBeDefined();
      expect(col!.createdAt).toBe(T1);
      expect(col!.updatedAt).toBe(T1);
    });
  });

  describe("updateColumn", () => {
    it("bumps updatedAt and preserves createdAt", () => {
      const { result } = renderHook(() => useBoard(), { wrapper });

      act(() => {
        result.current.resetBoard();
      });

      act(() => {
        result.current.addColumn("Test");
      });

      const col = result.current.columns[0];
      const originalCreatedAt = col.createdAt;

      vi.setSystemTime(new Date(T1));

      act(() => {
        result.current.updateColumn(col.id, "Updated");
      });

      const updated = result.current.columns[0];
      expect(updated.title).toBe("Updated");
      expect(updated.createdAt).toBe(originalCreatedAt);
      expect(updated.updatedAt).toBe(T1);
    });
  });

  describe("addCard", () => {
    it("sets createdAt, updatedAt, and initial columnHistory", () => {
      const { result } = renderHook(() => useBoard(), { wrapper });

      act(() => {
        result.current.resetBoard();
      });

      vi.setSystemTime(new Date(T1));

      act(() => {
        result.current.addColumn("Test Column");
      });

      const colId = result.current.columns[0].id;

      vi.setSystemTime(new Date(T2));

      act(() => {
        result.current.addCard(colId, "New Card");
      });

      const card = result.current.columns[0].cards[0];
      expect(card.title).toBe("New Card");
      expect(card.createdAt).toBe(T2);
      expect(card.updatedAt).toBe(T2);
      expect(card.columnHistory).toEqual([{ columnId: colId, enteredAt: T2 }]);
    });

    it("bumps column updatedAt when card is added", () => {
      const { result } = renderHook(() => useBoard(), { wrapper });

      act(() => {
        result.current.resetBoard();
      });

      act(() => {
        result.current.addColumn("Test Column");
      });

      const colCreatedAt = result.current.columns[0].createdAt;

      vi.setSystemTime(new Date(T2));

      act(() => {
        result.current.addCard(result.current.columns[0].id, "Card");
      });

      expect(result.current.columns[0].updatedAt).toBe(T2);
      expect(result.current.columns[0].createdAt).toBe(colCreatedAt);
    });
  });

  describe("updateCard", () => {
    it("bumps card and column updatedAt, preserves createdAt", () => {
      const { result } = renderHook(() => useBoard(), { wrapper });

      act(() => {
        result.current.resetBoard();
      });

      act(() => {
        result.current.addColumn("Test");
      });

      const colId = result.current.columns[0].id;

      act(() => {
        result.current.addCard(colId, "Original");
      });

      const card = result.current.columns[0].cards[0];
      const cardCreatedAt = card.createdAt;

      vi.setSystemTime(new Date(T2));

      act(() => {
        result.current.updateCard(colId, card.id, "Updated");
      });

      const updatedCard = result.current.columns[0].cards[0];
      expect(updatedCard.title).toBe("Updated");
      expect(updatedCard.createdAt).toBe(cardCreatedAt);
      expect(updatedCard.updatedAt).toBe(T2);
      expect(result.current.columns[0].updatedAt).toBe(T2);
    });
  });

  describe("removeCard", () => {
    it("bumps column updatedAt", () => {
      const { result } = renderHook(() => useBoard(), { wrapper });

      act(() => {
        result.current.resetBoard();
      });

      act(() => {
        result.current.addColumn("Test");
      });

      const colId = result.current.columns[0].id;

      act(() => {
        result.current.addCard(colId, "Card");
      });

      const cardId = result.current.columns[0].cards[0].id;

      vi.setSystemTime(new Date(T2));

      act(() => {
        result.current.removeCard(colId, cardId);
      });

      expect(result.current.columns[0].cards).toHaveLength(0);
      expect(result.current.columns[0].updatedAt).toBe(T2);
    });
  });

  describe("sortCards", () => {
    it("bumps column updatedAt but not individual card updatedAt", () => {
      const { result } = renderHook(() => useBoard(), { wrapper });

      act(() => {
        result.current.resetBoard();
      });

      act(() => {
        result.current.addColumn("Test");
      });

      const colId = result.current.columns[0].id;

      act(() => {
        result.current.addCard(colId, "Banana");
        result.current.addCard(colId, "Apple");
      });

      const cardUpdatedAts = result.current.columns[0].cards.map(
        (c) => c.updatedAt,
      );

      vi.setSystemTime(new Date(T2));

      act(() => {
        result.current.sortCards(colId);
      });

      // Cards should be sorted alphabetically
      expect(result.current.columns[0].cards[0].title).toBe("Apple");
      expect(result.current.columns[0].cards[1].title).toBe("Banana");

      // Column updatedAt should be bumped
      expect(result.current.columns[0].updatedAt).toBe(T2);

      // Individual card updatedAts should NOT be changed
      const sortedCards = result.current.columns[0].cards;
      // "Apple" was originally cards[1] (index 1), "Banana" was cards[0] (index 0)
      expect(sortedCards[0].updatedAt).toBe(cardUpdatedAts[1]); // Apple
      expect(sortedCards[1].updatedAt).toBe(cardUpdatedAts[0]); // Banana
    });
  });
});
