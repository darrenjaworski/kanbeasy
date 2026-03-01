import { act, renderHook } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { useBoardMutations } from "../useBoardMutations";
import type { ArchivedCard, BoardState, Card, Column } from "../types";

/* ------------------------------------------------------------------ */
/*  Helpers                                                           */
/* ------------------------------------------------------------------ */

function makeCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    number: 1,
    title: "",
    description: "",
    ticketTypeId: null,
    createdAt: 1000,
    updatedAt: 1000,
    columnHistory: [],
    ...overrides,
  };
}

function makeColumn(
  overrides: Partial<Column> & { id: string; cards: Card[] },
): Column {
  return {
    title: "",
    createdAt: 1000,
    updatedAt: 1000,
    ...overrides,
  };
}

function makeArchivedCard(
  overrides: Partial<ArchivedCard> & { id: string },
): ArchivedCard {
  return {
    number: 1,
    title: "",
    description: "",
    ticketTypeId: null,
    createdAt: 1000,
    updatedAt: 1000,
    columnHistory: [],
    archivedAt: 2000,
    archivedFromColumnId: "col-1",
    ...overrides,
  };
}

/**
 * Renders the hook with mocked dependencies and returns helpers
 * for calling mutations and extracting the resulting state.
 */
function setup(initialCounter = 1) {
  const mockSetState =
    vi.fn<React.Dispatch<React.SetStateAction<BoardState>>>();
  const ref = { current: initialCounter };
  const saveCounter = vi.fn<(n: number) => void>();

  const { result } = renderHook(() =>
    useBoardMutations(mockSetState, ref, saveCounter),
  );

  /**
   * Extracts the state-updater function from the most recent
   * setState call and applies it to `prev` to get the next state.
   */
  function applyLatest(prev: BoardState): BoardState {
    const lastCall = mockSetState.mock.calls.at(-1);
    if (!lastCall) throw new Error("setState was never called");
    const updater = lastCall[0];
    if (typeof updater === "function") return updater(prev);
    return updater;
  }

  return { result, mockSetState, ref, saveCounter, applyLatest };
}

const emptyState: BoardState = { columns: [], archive: [] };

/* ------------------------------------------------------------------ */
/*  Tests                                                             */
/* ------------------------------------------------------------------ */

describe("useBoardMutations", () => {
  /* -------------------- addColumn -------------------- */

  describe("addColumn", () => {
    it("appends a column with the given title", () => {
      const { result, applyLatest } = setup();

      act(() => result.current.addColumn("Todo"));

      const next = applyLatest(emptyState);
      expect(next.columns).toHaveLength(1);
      expect(next.columns[0].title).toBe("Todo");
      expect(next.columns[0].cards).toEqual([]);
      expect(next.columns[0].id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
    });

    it("defaults title to empty string", () => {
      const { result, applyLatest } = setup();

      act(() => result.current.addColumn());

      const next = applyLatest(emptyState);
      expect(next.columns[0].title).toBe("");
    });

    it("preserves existing columns", () => {
      const { result, applyLatest } = setup();
      const existing = makeColumn({ id: "col-1", cards: [] });

      act(() => result.current.addColumn("New"));

      const next = applyLatest({ columns: [existing], archive: [] });
      expect(next.columns).toHaveLength(2);
      expect(next.columns[0].id).toBe("col-1");
    });
  });

  /* -------------------- updateColumn -------------------- */

  describe("updateColumn", () => {
    it("updates the title of the matching column", () => {
      const { result, applyLatest } = setup();
      const col = makeColumn({ id: "col-1", title: "Old", cards: [] });

      act(() => result.current.updateColumn("col-1", "New"));

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].title).toBe("New");
      expect(next.columns[0].updatedAt).toBeGreaterThan(col.updatedAt);
    });

    it("leaves other columns unchanged", () => {
      const { result, applyLatest } = setup();
      const col1 = makeColumn({ id: "col-1", title: "A", cards: [] });
      const col2 = makeColumn({ id: "col-2", title: "B", cards: [] });

      act(() => result.current.updateColumn("col-1", "Updated"));

      const next = applyLatest({ columns: [col1, col2], archive: [] });
      expect(next.columns[1].title).toBe("B");
      expect(next.columns[1].updatedAt).toBe(col2.updatedAt);
    });
  });

  /* -------------------- removeColumn -------------------- */

  describe("removeColumn", () => {
    it("removes the column by id", () => {
      const { result, applyLatest } = setup();
      const col = makeColumn({ id: "col-1", cards: [] });

      act(() => result.current.removeColumn("col-1"));

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns).toHaveLength(0);
    });

    it("archives cards from the removed column", () => {
      const { result, applyLatest } = setup();
      const card = makeCard({ id: "card-1" });
      const col = makeColumn({ id: "col-1", cards: [card] });

      act(() => result.current.removeColumn("col-1"));

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.archive).toHaveLength(1);
      expect(next.archive[0].id).toBe("card-1");
      expect(next.archive[0].archivedFromColumnId).toBe("col-1");
    });

    it("appends to existing archive", () => {
      const { result, applyLatest } = setup();
      const card = makeCard({ id: "card-2" });
      const col = makeColumn({ id: "col-2", cards: [card] });
      const existingArchived = makeArchivedCard({ id: "card-old" });

      act(() => result.current.removeColumn("col-2"));

      const next = applyLatest({
        columns: [col],
        archive: [existingArchived],
      });
      expect(next.archive).toHaveLength(2);
      expect(next.archive[0].id).toBe("card-old");
      expect(next.archive[1].id).toBe("card-2");
    });
  });

  /* -------------------- setColumns -------------------- */

  describe("setColumns", () => {
    it("replaces columns", () => {
      const { result, applyLatest } = setup();
      const newCols = [makeColumn({ id: "new-1", cards: [] })];

      act(() => result.current.setColumns(newCols));

      const next = applyLatest({
        columns: [makeColumn({ id: "old-1", cards: [] })],
        archive: [],
      });
      expect(next.columns).toHaveLength(1);
      expect(next.columns[0].id).toBe("new-1");
    });

    it("replaces archive when provided", () => {
      const { result, applyLatest } = setup();
      const newArchive = [makeArchivedCard({ id: "a-1" })];

      act(() => result.current.setColumns([], newArchive));

      const next = applyLatest({
        columns: [],
        archive: [makeArchivedCard({ id: "a-old" })],
      });
      expect(next.archive).toHaveLength(1);
      expect(next.archive[0].id).toBe("a-1");
    });

    it("preserves archive when not provided", () => {
      const { result, applyLatest } = setup();

      act(() => result.current.setColumns([]));

      const existing = [makeArchivedCard({ id: "a-keep" })];
      const next = applyLatest({ columns: [], archive: existing });
      expect(next.archive).toHaveLength(1);
      expect(next.archive[0].id).toBe("a-keep");
    });
  });

  /* -------------------- addCard -------------------- */

  describe("addCard", () => {
    it("adds a card to the top of the target column", () => {
      const { result, applyLatest } = setup(5);
      const existingCard = makeCard({ id: "existing" });
      const col = makeColumn({ id: "col-1", cards: [existingCard] });

      act(() => {
        result.current.addCard("col-1", "My Task");
      });

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards).toHaveLength(2);
      expect(next.columns[0].cards[0].title).toBe("My Task");
      expect(next.columns[0].cards[0].number).toBe(5);
      expect(next.columns[0].cards[1].id).toBe("existing");
    });

    it("initializes column history with the target column", () => {
      const { result, applyLatest } = setup();
      const col = makeColumn({ id: "col-1", cards: [] });

      act(() => {
        result.current.addCard("col-1", "Test");
      });

      const next = applyLatest({ columns: [col], archive: [] });
      const card = next.columns[0].cards[0];
      expect(card.columnHistory).toHaveLength(1);
      expect(card.columnHistory[0].columnId).toBe("col-1");
    });

    it("increments the card counter", () => {
      const { result, saveCounter } = setup(3);

      act(() => {
        result.current.addCard("col-1", "Test");
      });

      expect(saveCounter).toHaveBeenCalledWith(4);
    });

    it("returns the new card id", () => {
      const { result } = setup();
      let id: string | undefined;

      act(() => {
        id = result.current.addCard("col-1");
      });

      expect(id).toBeDefined();
      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
    });

    it("defaults title to empty string", () => {
      const { result, applyLatest } = setup();
      const col = makeColumn({ id: "col-1", cards: [] });

      act(() => {
        result.current.addCard("col-1");
      });

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards[0].title).toBe("");
    });
  });

  /* -------------------- removeCard -------------------- */

  describe("removeCard", () => {
    it("removes the card from the column", () => {
      const { result, applyLatest } = setup();
      const card = makeCard({ id: "card-1" });
      const col = makeColumn({ id: "col-1", cards: [card] });

      act(() => result.current.removeCard("col-1", "card-1"));

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards).toHaveLength(0);
    });

    it("returns prev state when column not found", () => {
      const { result, applyLatest } = setup();
      const prev: BoardState = {
        columns: [makeColumn({ id: "col-1", cards: [] })],
        archive: [],
      };

      act(() => result.current.removeCard("no-such-col", "card-1"));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });

    it("leaves cards unchanged when card not found in column", () => {
      const { result, applyLatest } = setup();
      const card = makeCard({ id: "card-1" });
      const col = makeColumn({ id: "col-1", cards: [card] });

      act(() => result.current.removeCard("col-1", "no-such-card"));

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards).toHaveLength(1);
      expect(next.columns[0].cards[0].id).toBe("card-1");
    });
  });

  /* -------------------- updateCard -------------------- */

  describe("updateCard", () => {
    it("updates card fields and updatedAt", () => {
      const { result, applyLatest } = setup();
      const card = makeCard({ id: "card-1", title: "Old" });
      const col = makeColumn({ id: "col-1", cards: [card] });

      act(() => result.current.updateCard("col-1", "card-1", { title: "New" }));

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards[0].title).toBe("New");
      expect(next.columns[0].cards[0].updatedAt).toBeGreaterThan(
        card.updatedAt,
      );
    });

    it("updates ticketTypeId", () => {
      const { result, applyLatest } = setup();
      const card = makeCard({ id: "card-1", ticketTypeId: null });
      const col = makeColumn({ id: "col-1", cards: [card] });

      act(() =>
        result.current.updateCard("col-1", "card-1", {
          ticketTypeId: "feat",
        }),
      );

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards[0].ticketTypeId).toBe("feat");
    });

    it("returns prev state when column not found", () => {
      const { result, applyLatest } = setup();
      const prev: BoardState = emptyState;

      act(() => result.current.updateCard("nope", "card-1", { title: "X" }));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });

    it("returns prev state when card not found", () => {
      const { result, applyLatest } = setup();
      const col = makeColumn({ id: "col-1", cards: [] });
      const prev: BoardState = { columns: [col], archive: [] };

      act(() => result.current.updateCard("col-1", "nope", { title: "X" }));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });
  });

  /* -------------------- sortCards -------------------- */

  describe("sortCards", () => {
    it("sorts cards alphabetically by title (case-insensitive)", () => {
      const { result, applyLatest } = setup();
      const cards = [
        makeCard({ id: "c", title: "cherry" }),
        makeCard({ id: "a", title: "Apple" }),
        makeCard({ id: "b", title: "banana" }),
      ];
      const col = makeColumn({ id: "col-1", cards });

      act(() => result.current.sortCards("col-1"));

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards.map((c) => c.title)).toEqual([
        "Apple",
        "banana",
        "cherry",
      ]);
    });

    it("returns prev state when column not found", () => {
      const { result, applyLatest } = setup();
      const prev: BoardState = emptyState;

      act(() => result.current.sortCards("nope"));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });
  });

  /* -------------------- reorderCard -------------------- */

  describe("reorderCard", () => {
    it("moves a card from one position to another within a column", () => {
      const { result, applyLatest } = setup();
      const cards = [
        makeCard({ id: "card-1", title: "First" }),
        makeCard({ id: "card-2", title: "Second" }),
        makeCard({ id: "card-3", title: "Third" }),
      ];
      const col = makeColumn({ id: "col-1", cards });

      act(() => result.current.reorderCard("col-1", "card-1", "card-3"));

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards.map((c) => c.id)).toEqual([
        "card-2",
        "card-3",
        "card-1",
      ]);
    });

    it("returns prev state when column not found", () => {
      const { result, applyLatest } = setup();
      const prev: BoardState = emptyState;

      act(() => result.current.reorderCard("nope", "a", "b"));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });

    it("returns prev state when card ids not found or equal", () => {
      const { result, applyLatest } = setup();
      const card = makeCard({ id: "card-1" });
      const col = makeColumn({ id: "col-1", cards: [card] });
      const prev: BoardState = { columns: [col], archive: [] };

      act(() => result.current.reorderCard("col-1", "card-1", "card-1"));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });
  });

  /* -------------------- duplicateCard -------------------- */

  describe("duplicateCard", () => {
    it("duplicates a card with new id and number", () => {
      const { result, applyLatest, saveCounter } = setup(10);
      const col = makeColumn({ id: "col-1", cards: [] });

      act(() => {
        result.current.duplicateCard("col-1", {
          title: "Clone me",
          description: "Desc",
          ticketTypeId: "feat",
        });
      });

      const next = applyLatest({ columns: [col], archive: [] });
      const dup = next.columns[0].cards[0];
      expect(dup.title).toBe("Clone me");
      expect(dup.description).toBe("Desc");
      expect(dup.ticketTypeId).toBe("feat");
      expect(dup.number).toBe(10);
      expect(saveCounter).toHaveBeenCalledWith(11);
    });

    it("initializes columnHistory for the target column", () => {
      const { result, applyLatest } = setup();
      const col = makeColumn({ id: "col-2", cards: [] });

      act(() => {
        result.current.duplicateCard("col-2", {
          title: "X",
          description: "",
          ticketTypeId: null,
        });
      });

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards[0].columnHistory[0].columnId).toBe("col-2");
    });

    it("returns the new card id", () => {
      const { result } = setup();
      let id: string | undefined;

      act(() => {
        id = result.current.duplicateCard("col-1", {
          title: "",
          description: "",
          ticketTypeId: null,
        });
      });

      expect(id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-/);
    });
  });

  /* -------------------- moveCard -------------------- */

  describe("moveCard", () => {
    it("moves a card between columns via dropCardOnColumn", () => {
      const { result, applyLatest } = setup();
      const card = makeCard({
        id: "card-1",
        columnHistory: [{ columnId: "col-1", enteredAt: 1000 }],
      });
      const col1 = makeColumn({ id: "col-1", cards: [card] });
      const col2 = makeColumn({ id: "col-2", cards: [] });

      act(() => result.current.moveCard("col-1", "col-2", "card-1"));

      const next = applyLatest({
        columns: [col1, col2],
        archive: [],
      });
      expect(next.columns[0].cards).toHaveLength(0);
      expect(next.columns[1].cards).toHaveLength(1);
      expect(next.columns[1].cards[0].id).toBe("card-1");
    });

    it("does not call setState when from and to are the same", () => {
      const { result, mockSetState } = setup();

      act(() => result.current.moveCard("col-1", "col-1", "card-1"));

      expect(mockSetState).not.toHaveBeenCalled();
    });
  });

  /* -------------------- renameTicketType -------------------- */

  describe("renameTicketType", () => {
    it("renames ticketTypeId on matching cards across all columns", () => {
      const { result, applyLatest } = setup();
      const card1 = makeCard({ id: "c1", ticketTypeId: "bug" });
      const card2 = makeCard({ id: "c2", ticketTypeId: "feat" });
      const card3 = makeCard({ id: "c3", ticketTypeId: "bug" });
      const col1 = makeColumn({ id: "col-1", cards: [card1, card2] });
      const col2 = makeColumn({ id: "col-2", cards: [card3] });

      act(() => result.current.renameTicketType("bug", "defect"));

      const next = applyLatest({
        columns: [col1, col2],
        archive: [],
      });
      expect(next.columns[0].cards[0].ticketTypeId).toBe("defect");
      expect(next.columns[0].cards[1].ticketTypeId).toBe("feat");
      expect(next.columns[1].cards[0].ticketTypeId).toBe("defect");
    });
  });

  /* -------------------- clearTicketType -------------------- */

  describe("clearTicketType", () => {
    it("clears ticketTypeId to null on matching cards", () => {
      const { result, applyLatest } = setup();
      const card1 = makeCard({ id: "c1", ticketTypeId: "bug" });
      const card2 = makeCard({ id: "c2", ticketTypeId: "feat" });
      const col = makeColumn({ id: "col-1", cards: [card1, card2] });

      act(() => result.current.clearTicketType("bug"));

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards[0].ticketTypeId).toBeNull();
      expect(next.columns[0].cards[1].ticketTypeId).toBe("feat");
    });
  });

  /* -------------------- archiveCard -------------------- */

  describe("archiveCard", () => {
    it("moves a card from the column to the archive", () => {
      const { result, applyLatest } = setup();
      const card = makeCard({ id: "card-1" });
      const col = makeColumn({ id: "col-1", cards: [card] });

      act(() => result.current.archiveCard("col-1", "card-1"));

      const next = applyLatest({ columns: [col], archive: [] });
      expect(next.columns[0].cards).toHaveLength(0);
      expect(next.archive).toHaveLength(1);
      expect(next.archive[0].id).toBe("card-1");
      expect(next.archive[0].archivedFromColumnId).toBe("col-1");
      expect(next.archive[0].archivedAt).toBeGreaterThan(0);
    });

    it("returns prev state when column not found", () => {
      const { result, applyLatest } = setup();
      const prev: BoardState = emptyState;

      act(() => result.current.archiveCard("nope", "card-1"));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });

    it("returns prev state when card not found", () => {
      const { result, applyLatest } = setup();
      const col = makeColumn({ id: "col-1", cards: [] });
      const prev: BoardState = { columns: [col], archive: [] };

      act(() => result.current.archiveCard("col-1", "nope"));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });
  });

  /* -------------------- restoreCard -------------------- */

  describe("restoreCard", () => {
    it("restores an archived card to the target column", () => {
      const { result, applyLatest } = setup();
      const archived = makeArchivedCard({
        id: "card-1",
        archivedFromColumnId: "col-1",
        columnHistory: [{ columnId: "col-1", enteredAt: 1000 }],
      });
      const col = makeColumn({ id: "col-2", cards: [] });

      act(() => result.current.restoreCard("card-1", "col-2"));

      const next = applyLatest({
        columns: [col],
        archive: [archived],
      });
      expect(next.archive).toHaveLength(0);
      expect(next.columns[0].cards).toHaveLength(1);
      expect(next.columns[0].cards[0].id).toBe("card-1");
      // Should add new column history entry for restore target
      expect(next.columns[0].cards[0].columnHistory).toHaveLength(2);
      expect(next.columns[0].cards[0].columnHistory[1].columnId).toBe("col-2");
    });

    it("strips archive metadata from restored card", () => {
      const { result, applyLatest } = setup();
      const archived = makeArchivedCard({ id: "card-1" });
      const col = makeColumn({ id: "col-1", cards: [] });

      act(() => result.current.restoreCard("card-1", "col-1"));

      const next = applyLatest({
        columns: [col],
        archive: [archived],
      });
      const card = next.columns[0].cards[0];
      expect(card).not.toHaveProperty("archivedAt");
      expect(card).not.toHaveProperty("archivedFromColumnId");
    });

    it("returns prev state when archived card not found", () => {
      const { result, applyLatest } = setup();
      const prev: BoardState = {
        columns: [makeColumn({ id: "col-1", cards: [] })],
        archive: [],
      };

      act(() => result.current.restoreCard("nope", "col-1"));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });

    it("returns prev state when target column not found", () => {
      const { result, applyLatest } = setup();
      const archived = makeArchivedCard({ id: "card-1" });
      const prev: BoardState = { columns: [], archive: [archived] };

      act(() => result.current.restoreCard("card-1", "nope"));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });
  });

  /* -------------------- restoreCards -------------------- */

  describe("restoreCards", () => {
    it("restores multiple cards to their original columns", () => {
      const { result, applyLatest } = setup();
      const a1 = makeArchivedCard({
        id: "card-1",
        archivedFromColumnId: "col-1",
      });
      const a2 = makeArchivedCard({
        id: "card-2",
        archivedFromColumnId: "col-2",
      });
      const col1 = makeColumn({ id: "col-1", cards: [] });
      const col2 = makeColumn({ id: "col-2", cards: [] });

      act(() => result.current.restoreCards(["card-1", "card-2"]));

      const next = applyLatest({
        columns: [col1, col2],
        archive: [a1, a2],
      });
      expect(next.archive).toHaveLength(0);
      expect(next.columns[0].cards).toHaveLength(1);
      expect(next.columns[1].cards).toHaveLength(1);
    });

    it("falls back to first column when original column is gone", () => {
      const { result, applyLatest } = setup();
      const archived = makeArchivedCard({
        id: "card-1",
        archivedFromColumnId: "deleted-col",
      });
      const col = makeColumn({ id: "col-1", cards: [] });

      act(() => result.current.restoreCards(["card-1"]));

      const next = applyLatest({
        columns: [col],
        archive: [archived],
      });
      expect(next.columns[0].cards).toHaveLength(1);
      expect(next.columns[0].cards[0].id).toBe("card-1");
    });

    it("returns prev state when no matching cards found", () => {
      const { result, applyLatest } = setup();
      const prev: BoardState = {
        columns: [makeColumn({ id: "col-1", cards: [] })],
        archive: [],
      };

      act(() => result.current.restoreCards(["nope"]));

      const next = applyLatest(prev);
      expect(next).toBe(prev);
    });

    it("skips cards when board has no columns", () => {
      const { result, applyLatest } = setup();
      const archived = makeArchivedCard({
        id: "card-1",
        archivedFromColumnId: "deleted-col",
      });

      act(() => result.current.restoreCards(["card-1"]));

      const next = applyLatest({ columns: [], archive: [archived] });
      // Card is removed from archive even though it can't be placed
      // (targetIdx >= newColumns.length check prevents placement)
      expect(next.archive).toHaveLength(0);
      expect(next.columns).toHaveLength(0);
    });
  });

  /* -------------------- permanentlyDeleteCard -------------------- */

  describe("permanentlyDeleteCard", () => {
    it("removes the card from the archive", () => {
      const { result, applyLatest } = setup();
      const archived = makeArchivedCard({ id: "card-1" });

      act(() => result.current.permanentlyDeleteCard("card-1"));

      const next = applyLatest({ columns: [], archive: [archived] });
      expect(next.archive).toHaveLength(0);
    });

    it("leaves other archived cards untouched", () => {
      const { result, applyLatest } = setup();
      const a1 = makeArchivedCard({ id: "card-1" });
      const a2 = makeArchivedCard({ id: "card-2" });

      act(() => result.current.permanentlyDeleteCard("card-1"));

      const next = applyLatest({ columns: [], archive: [a1, a2] });
      expect(next.archive).toHaveLength(1);
      expect(next.archive[0].id).toBe("card-2");
    });
  });

  /* -------------------- permanentlyDeleteCards -------------------- */

  describe("permanentlyDeleteCards", () => {
    it("removes multiple cards from the archive", () => {
      const { result, applyLatest } = setup();
      const a1 = makeArchivedCard({ id: "card-1" });
      const a2 = makeArchivedCard({ id: "card-2" });
      const a3 = makeArchivedCard({ id: "card-3" });

      act(() => result.current.permanentlyDeleteCards(["card-1", "card-3"]));

      const next = applyLatest({
        columns: [],
        archive: [a1, a2, a3],
      });
      expect(next.archive).toHaveLength(1);
      expect(next.archive[0].id).toBe("card-2");
    });
  });

  /* -------------------- clearArchive -------------------- */

  describe("clearArchive", () => {
    it("empties the archive", () => {
      const { result, applyLatest } = setup();
      const a1 = makeArchivedCard({ id: "card-1" });

      act(() => result.current.clearArchive());

      const next = applyLatest({ columns: [], archive: [a1] });
      expect(next.archive).toHaveLength(0);
    });

    it("preserves columns", () => {
      const { result, applyLatest } = setup();
      const col = makeColumn({ id: "col-1", cards: [] });

      act(() => result.current.clearArchive());

      const next = applyLatest({
        columns: [col],
        archive: [makeArchivedCard({ id: "a" })],
      });
      expect(next.columns).toHaveLength(1);
    });
  });

  /* -------------------- resetBoard -------------------- */

  describe("resetBoard", () => {
    it("resets to default empty state", () => {
      const { result, mockSetState } = setup();

      act(() => result.current.resetBoard());

      expect(mockSetState).toHaveBeenCalledWith({
        columns: [],
        archive: [],
      });
    });
  });
});
