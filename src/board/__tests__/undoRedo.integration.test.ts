import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import React from "react";
import { BoardProvider } from "../BoardProvider";
import { useBoard } from "../useBoard";

function wrapper({ children }: { children: React.ReactNode }) {
  return React.createElement(BoardProvider, null, children);
}

describe("undo/redo through BoardProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("can undo addColumn", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    expect(result.current.columns).toHaveLength(0);

    act(() => result.current.addColumn("New"));
    expect(result.current.columns).toHaveLength(1);

    act(() => result.current.undo());
    expect(result.current.columns).toHaveLength(0);
  });

  it("can undo removeColumn", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col A"));
    const colId = result.current.columns[0].id;

    act(() => result.current.removeColumn(colId));
    expect(result.current.columns).toHaveLength(0);

    act(() => result.current.undo());
    expect(result.current.columns).toHaveLength(1);
    expect(result.current.columns[0].title).toBe("Col A");
  });

  it("can undo addCard", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;

    act(() => result.current.addCard(colId, "Card 1"));
    expect(result.current.columns[0].cards).toHaveLength(1);

    act(() => result.current.undo());
    expect(result.current.columns[0].cards).toHaveLength(0);
  });

  it("can undo removeCard", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;
    act(() => result.current.addCard(colId, "Card 1"));
    const cardId = result.current.columns[0].cards[0].id;

    act(() => result.current.removeCard(colId, cardId));
    expect(result.current.columns[0].cards).toHaveLength(0);

    act(() => result.current.undo());
    expect(result.current.columns[0].cards).toHaveLength(1);
    expect(result.current.columns[0].cards[0].title).toBe("Card 1");
  });

  it("can undo updateCard", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;
    act(() => result.current.addCard(colId, "Original"));
    const cardId = result.current.columns[0].cards[0].id;

    act(() => result.current.updateCard(colId, cardId, "Updated"));
    expect(result.current.columns[0].cards[0].title).toBe("Updated");

    act(() => result.current.undo());
    expect(result.current.columns[0].cards[0].title).toBe("Original");
  });

  it("can undo resetBoard", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col A"));
    act(() => result.current.addColumn("Col B"));
    expect(result.current.columns).toHaveLength(2);

    act(() => result.current.resetBoard());
    expect(result.current.columns).toHaveLength(0);

    act(() => result.current.undo());
    expect(result.current.columns).toHaveLength(2);
  });

  it("can undo setColumns (import)", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Original"));

    const now = Date.now();
    const imported = [
      {
        id: "imp-1",
        title: "Imported",
        cards: [],
        createdAt: now,
        updatedAt: now,
      },
    ];
    act(() => result.current.setColumns(imported));
    expect(result.current.columns[0].title).toBe("Imported");

    act(() => result.current.undo());
    expect(result.current.columns[0].title).toBe("Original");
  });

  it("can redo after undo", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    act(() => result.current.undo());
    expect(result.current.columns).toHaveLength(0);
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.redo());
    expect(result.current.columns).toHaveLength(1);
    expect(result.current.columns[0].title).toBe("Col");
  });

  it("clears redo on new mutation", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("A"));
    act(() => result.current.addColumn("B"));
    act(() => result.current.undo());
    expect(result.current.canRedo).toBe(true);

    act(() => result.current.addColumn("C"));
    expect(result.current.canRedo).toBe(false);
  });

  it("no-op mutation does not create history entry", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));

    // removeCard on a non-existent card is a no-op (returns prev reference)
    act(() => result.current.removeCard("nonexistent", "nonexistent"));

    // Only 2 undo steps: addColumn and resetBoard
    act(() => result.current.undo());
    expect(result.current.columns).toHaveLength(0); // undid addColumn
  });
});
