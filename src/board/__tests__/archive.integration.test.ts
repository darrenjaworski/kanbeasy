import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { BoardProvider } from "../BoardProvider";
import { useBoard } from "../useBoard";

function wrapper({ children }: { children: ReactNode }) {
  return createElement(BoardProvider, null, children);
}

describe("card archive through BoardProvider", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("archiveCard removes card from column and adds to archive", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;
    act(() => result.current.addCard(colId, "Task 1"));
    const cardId = result.current.columns[0].cards[0].id;

    act(() => result.current.archiveCard(colId, cardId));

    expect(result.current.columns[0].cards).toHaveLength(0);
    expect(result.current.archive).toHaveLength(1);
    expect(result.current.archive[0].id).toBe(cardId);
    expect(result.current.archive[0].title).toBe("Task 1");
    expect(result.current.archive[0].archivedFromColumnId).toBe(colId);
    expect(typeof result.current.archive[0].archivedAt).toBe("number");
  });

  it("restoreCard removes from archive and adds to target column", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col A"));
    act(() => result.current.addColumn("Col B"));
    const colAId = result.current.columns[0].id;
    const colBId = result.current.columns[1].id;
    act(() => result.current.addCard(colAId, "Task 1"));
    const cardId = result.current.columns[0].cards[0].id;

    // Archive from Col A
    act(() => result.current.archiveCard(colAId, cardId));
    expect(result.current.archive).toHaveLength(1);

    // Restore to Col B
    act(() => result.current.restoreCard(cardId, colBId));

    expect(result.current.archive).toHaveLength(0);
    expect(result.current.columns[1].cards).toHaveLength(1);
    expect(result.current.columns[1].cards[0].id).toBe(cardId);
    expect(result.current.columns[1].cards[0].title).toBe("Task 1");
    // Should have a new column history entry
    const history = result.current.columns[1].cards[0].columnHistory;
    expect(history[history.length - 1].columnId).toBe(colBId);
  });

  it("permanentlyDeleteCard removes from archive", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;
    act(() => result.current.addCard(colId, "Task 1"));
    const cardId = result.current.columns[0].cards[0].id;

    act(() => result.current.archiveCard(colId, cardId));
    expect(result.current.archive).toHaveLength(1);

    act(() => result.current.permanentlyDeleteCard(cardId));
    expect(result.current.archive).toHaveLength(0);
  });

  it("clearArchive empties the archive", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;
    act(() => result.current.addCard(colId, "Task 1"));
    act(() => result.current.addCard(colId, "Task 2"));
    const card1Id = result.current.columns[0].cards[0].id;
    const card2Id = result.current.columns[0].cards[1].id;

    act(() => result.current.archiveCard(colId, card1Id));
    act(() => result.current.archiveCard(colId, card2Id));
    expect(result.current.archive).toHaveLength(2);

    act(() => result.current.clearArchive());
    expect(result.current.archive).toHaveLength(0);
  });

  it("undo archiveCard restores card to column", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;
    act(() => result.current.addCard(colId, "Task 1"));
    const cardId = result.current.columns[0].cards[0].id;

    act(() => result.current.archiveCard(colId, cardId));
    expect(result.current.columns[0].cards).toHaveLength(0);
    expect(result.current.archive).toHaveLength(1);

    act(() => result.current.undo());
    expect(result.current.columns[0].cards).toHaveLength(1);
    expect(result.current.columns[0].cards[0].id).toBe(cardId);
    expect(result.current.archive).toHaveLength(0);
  });

  it("undo restoreCard puts card back in archive", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;
    act(() => result.current.addCard(colId, "Task 1"));
    const cardId = result.current.columns[0].cards[0].id;

    act(() => result.current.archiveCard(colId, cardId));
    act(() => result.current.restoreCard(cardId, colId));
    expect(result.current.columns[0].cards).toHaveLength(1);
    expect(result.current.archive).toHaveLength(0);

    act(() => result.current.undo());
    expect(result.current.columns[0].cards).toHaveLength(0);
    expect(result.current.archive).toHaveLength(1);
  });

  it("archiveCard is a no-op for non-existent card", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;

    act(() => result.current.archiveCard(colId, "nonexistent"));
    expect(result.current.archive).toHaveLength(0);
  });

  it("restoreCard is a no-op for non-existent archived card", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;

    act(() => result.current.restoreCard("nonexistent", colId));
    expect(result.current.columns[0].cards).toHaveLength(0);
  });

  it("restoreCards bulk-restores multiple cards to their original columns", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col A"));
    act(() => result.current.addColumn("Col B"));
    const colAId = result.current.columns[0].id;
    const colBId = result.current.columns[1].id;
    act(() => result.current.addCard(colAId, "Task 1"));
    act(() => result.current.addCard(colBId, "Task 2"));
    const card1Id = result.current.columns[0].cards[0].id;
    const card2Id = result.current.columns[1].cards[0].id;

    // Archive both
    act(() => result.current.archiveCard(colAId, card1Id));
    act(() => result.current.archiveCard(colBId, card2Id));
    expect(result.current.archive).toHaveLength(2);

    // Bulk restore
    act(() => result.current.restoreCards([card1Id, card2Id]));

    expect(result.current.archive).toHaveLength(0);
    expect(result.current.columns[0].cards).toHaveLength(1);
    expect(result.current.columns[1].cards).toHaveLength(1);
    expect(result.current.columns[0].cards[0].id).toBe(card1Id);
    expect(result.current.columns[1].cards[0].id).toBe(card2Id);
  });

  it("restoreCards falls back to first column when original column is gone", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col A"));
    act(() => result.current.addColumn("Col B"));
    const colBId = result.current.columns[1].id;
    act(() => result.current.addCard(colBId, "Task 1"));
    const cardId = result.current.columns[1].cards[0].id;

    // Archive from Col B, then remove Col B
    act(() => result.current.archiveCard(colBId, cardId));
    act(() => result.current.removeColumn(colBId));
    expect(result.current.columns).toHaveLength(1);
    expect(result.current.archive).toHaveLength(1);

    // Bulk restore — original column is gone, should go to first column
    act(() => result.current.restoreCards([cardId]));

    expect(result.current.archive).toHaveLength(0);
    expect(result.current.columns[0].cards).toHaveLength(1);
    expect(result.current.columns[0].cards[0].id).toBe(cardId);
  });

  it("restoreCards is a no-op when no matching archived cards", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;

    act(() => result.current.restoreCards(["nonexistent"]));
    expect(result.current.columns[0].cards).toHaveLength(0);
    expect(result.current.archive).toHaveLength(0);
    // Verify no undo entry was added (state unchanged)
    expect(result.current.columns[0].id).toBe(colId);
  });

  it("permanentlyDeleteCards bulk-deletes multiple archived cards", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;
    act(() => result.current.addCard(colId, "Task 1"));
    act(() => result.current.addCard(colId, "Task 2"));
    act(() => result.current.addCard(colId, "Task 3"));
    const card1Id = result.current.columns[0].cards[0].id;
    const card2Id = result.current.columns[0].cards[1].id;
    const card3Id = result.current.columns[0].cards[2].id;

    act(() => result.current.archiveCard(colId, card1Id));
    act(() => result.current.archiveCard(colId, card2Id));
    act(() => result.current.archiveCard(colId, card3Id));
    expect(result.current.archive).toHaveLength(3);

    // Bulk delete first two
    act(() => result.current.permanentlyDeleteCards([card1Id, card2Id]));

    expect(result.current.archive).toHaveLength(1);
    expect(result.current.archive[0].id).toBe(card3Id);
  });

  it("resetBoard clears both columns and archive", () => {
    const { result } = renderHook(() => useBoard(), { wrapper });

    act(() => result.current.resetBoard());
    act(() => result.current.addColumn("Col"));
    const colId = result.current.columns[0].id;
    act(() => result.current.addCard(colId, "Task 1"));
    const cardId = result.current.columns[0].cards[0].id;
    act(() => result.current.archiveCard(colId, cardId));

    act(() => result.current.resetBoard());
    expect(result.current.columns).toHaveLength(0);
    expect(result.current.archive).toHaveLength(0);
  });
});
