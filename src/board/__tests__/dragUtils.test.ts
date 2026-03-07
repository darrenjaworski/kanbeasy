import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  findColumnIndex,
  findCardIndex,
  findCardInColumns,
  reorderColumns,
  moveCardWithinColumn,
  moveCardAcrossColumns,
  dropCardOnColumn,
} from "../dragUtils";
import type { Column } from "../types";
import {
  makeCard,
  makeColumn,
  resetCardNumber,
} from "../../test/builders";

describe("dragUtils", () => {
  beforeEach(() => {
    resetCardNumber(0);
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const NOW = new Date("2025-06-15T12:00:00Z").getTime();

  const mockColumns: Column[] = [
    makeColumn({
      id: "col-1",
      title: "Column 1",
      cards: [
        makeCard({
          id: "card-1",
          title: "Card 1",
          columnHistory: [{ columnId: "col-1", enteredAt: 1000 }],
        }),
        makeCard({
          id: "card-2",
          title: "Card 2",
          columnHistory: [{ columnId: "col-1", enteredAt: 1000 }],
        }),
        makeCard({
          id: "card-3",
          title: "Card 3",
          columnHistory: [{ columnId: "col-1", enteredAt: 1000 }],
        }),
      ],
    }),
    makeColumn({
      id: "col-2",
      title: "Column 2",
      cards: [
        makeCard({
          id: "card-4",
          title: "Card 4",
          columnHistory: [{ columnId: "col-2", enteredAt: 1000 }],
        }),
        makeCard({
          id: "card-5",
          title: "Card 5",
          columnHistory: [{ columnId: "col-2", enteredAt: 1000 }],
        }),
      ],
    }),
    makeColumn({ id: "col-3", title: "Column 3", cards: [] }),
  ];

  describe("findColumnIndex", () => {
    it("returns the correct index when column exists", () => {
      expect(findColumnIndex(mockColumns, "col-1")).toBe(0);
      expect(findColumnIndex(mockColumns, "col-2")).toBe(1);
      expect(findColumnIndex(mockColumns, "col-3")).toBe(2);
    });

    it("returns -1 when column does not exist", () => {
      expect(findColumnIndex(mockColumns, "non-existent")).toBe(-1);
    });
  });

  describe("findCardIndex", () => {
    it("returns the correct index when card exists", () => {
      const cards = mockColumns[0].cards;
      expect(findCardIndex(cards, "card-1")).toBe(0);
      expect(findCardIndex(cards, "card-2")).toBe(1);
      expect(findCardIndex(cards, "card-3")).toBe(2);
    });

    it("returns -1 when card does not exist", () => {
      const cards = mockColumns[0].cards;
      expect(findCardIndex(cards, "non-existent")).toBe(-1);
    });
  });

  describe("findCardInColumns", () => {
    it("finds card in the first column", () => {
      const card = findCardInColumns(mockColumns, "card-1");
      expect(card).toEqual(
        expect.objectContaining({ id: "card-1", title: "Card 1" }),
      );
    });

    it("finds card in the second column", () => {
      const card = findCardInColumns(mockColumns, "card-4");
      expect(card).toEqual(
        expect.objectContaining({ id: "card-4", title: "Card 4" }),
      );
    });

    it("returns null when card does not exist", () => {
      const card = findCardInColumns(mockColumns, "non-existent");
      expect(card).toBeNull();
    });
  });

  describe("reorderColumns", () => {
    it("reorders columns correctly", () => {
      const result = reorderColumns(mockColumns, "col-1", "col-2");
      expect(result[0].id).toBe("col-2");
      expect(result[1].id).toBe("col-1");
      expect(result[2].id).toBe("col-3");
    });

    it("bumps updatedAt on all columns when reordered", () => {
      const result = reorderColumns(mockColumns, "col-1", "col-2");
      for (const col of result) {
        expect(col.updatedAt).toBe(NOW);
      }
    });

    it("returns original array when oldIndex equals newIndex", () => {
      const result = reorderColumns(mockColumns, "col-1", "col-1");
      expect(result).toBe(mockColumns);
    });

    it("returns original array when column not found", () => {
      const result = reorderColumns(mockColumns, "non-existent", "col-2");
      expect(result).toBe(mockColumns);
    });

    it("resets card columnHistory to a single entry for the current column", () => {
      // Give card-1 a multi-step history (col-1 → col-2 → back to col-1)
      const columnsWithHistory: Column[] = [
        makeColumn({
          id: "col-1",
          title: "Column 1",
          cards: [
            makeCard({
              id: "card-1",
              title: "Card 1",
              columnHistory: [
                { columnId: "col-1", enteredAt: 500 },
                { columnId: "col-2", enteredAt: 700 },
                { columnId: "col-1", enteredAt: 900 },
              ],
            }),
          ],
        }),
        makeColumn({
          id: "col-2",
          title: "Column 2",
          cards: [
            makeCard({
              id: "card-4",
              title: "Card 4",
              columnHistory: [{ columnId: "col-2", enteredAt: 1000 }],
            }),
          ],
        }),
        makeColumn({ id: "col-3", title: "Column 3", cards: [] }),
      ];

      const result = reorderColumns(columnsWithHistory, "col-1", "col-3");

      // card-1 is in col-1 — history should be reset to a single entry
      const card1 = result
        .find((c) => c.id === "col-1")!
        .cards.find((c) => c.id === "card-1")!;
      expect(card1.columnHistory).toHaveLength(1);
      expect(card1.columnHistory[0].columnId).toBe("col-1");
      expect(card1.columnHistory[0].enteredAt).toBe(NOW);

      // card-4 in col-2 should also be reset
      const card4 = result
        .find((c) => c.id === "col-2")!
        .cards.find((c) => c.id === "card-4")!;
      expect(card4.columnHistory).toHaveLength(1);
      expect(card4.columnHistory[0].columnId).toBe("col-2");
      expect(card4.columnHistory[0].enteredAt).toBe(NOW);
    });

    it("resets card createdAt and updatedAt timestamps on reorder", () => {
      const result = reorderColumns(mockColumns, "col-1", "col-2");

      // All cards should have their timestamps reset
      for (const col of result) {
        for (const card of col.cards) {
          expect(card.createdAt).toBe(NOW);
          expect(card.updatedAt).toBe(NOW);
        }
      }
    });
  });

  describe("moveCardWithinColumn", () => {
    it("reorders cards within the same column", () => {
      const result = moveCardWithinColumn(
        mockColumns,
        "col-1",
        "card-1",
        "card-3",
      );
      expect(result[0].cards[0].id).toBe("card-2");
      expect(result[0].cards[1].id).toBe("card-3");
      expect(result[0].cards[2].id).toBe("card-1");
    });

    it("bumps updatedAt on moved card and column", () => {
      const result = moveCardWithinColumn(
        mockColumns,
        "col-1",
        "card-1",
        "card-3",
      );
      const movedCard = result[0].cards.find((c) => c.id === "card-1")!;
      expect(movedCard.updatedAt).toBe(NOW);
      expect(result[0].updatedAt).toBe(NOW);
    });

    it("does NOT append columnHistory on within-column move", () => {
      const result = moveCardWithinColumn(
        mockColumns,
        "col-1",
        "card-1",
        "card-3",
      );
      const movedCard = result[0].cards.find((c) => c.id === "card-1")!;
      expect(movedCard.columnHistory).toHaveLength(1);
      expect(movedCard.columnHistory[0].columnId).toBe("col-1");
    });

    it("returns original array when column not found", () => {
      const result = moveCardWithinColumn(
        mockColumns,
        "non-existent",
        "card-1",
        "card-2",
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when card not found", () => {
      const result = moveCardWithinColumn(
        mockColumns,
        "col-1",
        "non-existent",
        "card-2",
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when cards are the same", () => {
      const result = moveCardWithinColumn(
        mockColumns,
        "col-1",
        "card-1",
        "card-1",
      );
      expect(result).toBe(mockColumns);
    });
  });

  describe("moveCardAcrossColumns", () => {
    it("moves card from one column to another", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "col-1",
        "col-2",
        "card-1",
        "card-4",
      );

      expect(result[0].cards.length).toBe(2);
      expect(result[0].cards.find((c) => c.id === "card-1")).toBeUndefined();

      expect(result[1].cards.length).toBe(3);
      expect(result[1].cards[0].id).toBe("card-1");
      expect(result[1].cards[1].id).toBe("card-4");
    });

    it("appends columnHistory entry on cross-column move", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "col-1",
        "col-2",
        "card-1",
        "card-4",
      );

      const movedCard = result[1].cards.find((c) => c.id === "card-1")!;
      expect(movedCard.columnHistory).toHaveLength(2);
      expect(movedCard.columnHistory[0]).toEqual({
        columnId: "col-1",
        enteredAt: 1000,
      });
      expect(movedCard.columnHistory[1]).toEqual({
        columnId: "col-2",
        enteredAt: NOW,
      });
    });

    it("bumps updatedAt on moved card and both columns", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "col-1",
        "col-2",
        "card-1",
        "card-4",
      );

      const movedCard = result[1].cards.find((c) => c.id === "card-1")!;
      expect(movedCard.updatedAt).toBe(NOW);
      expect(result[0].updatedAt).toBe(NOW); // from column
      expect(result[1].updatedAt).toBe(NOW); // to column
    });

    it("moves card to end when overCardId not found", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "col-1",
        "col-2",
        "card-1",
        "non-existent",
      );

      expect(result[1].cards.length).toBe(3);
      expect(result[1].cards[2].id).toBe("card-1");
    });

    it("returns original array when fromColumn not found", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "non-existent",
        "col-2",
        "card-1",
        "card-4",
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when toColumn not found", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "col-1",
        "non-existent",
        "card-1",
        "card-4",
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when card not found", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "col-1",
        "col-2",
        "non-existent",
        "card-4",
      );
      expect(result).toBe(mockColumns);
    });
  });

  describe("dropCardOnColumn", () => {
    it("moves card to end when dropped in same column", () => {
      const result = dropCardOnColumn(mockColumns, "col-1", "col-1", "card-1");

      expect(result[0].cards[0].id).toBe("card-2");
      expect(result[0].cards[1].id).toBe("card-3");
      expect(result[0].cards[2].id).toBe("card-1");
    });

    it("does NOT append columnHistory on same-column drop", () => {
      const result = dropCardOnColumn(mockColumns, "col-1", "col-1", "card-1");
      const movedCard = result[0].cards.find((c) => c.id === "card-1")!;
      expect(movedCard.columnHistory).toHaveLength(1);
    });

    it("moves card to beginning when dropped in different column", () => {
      const result = dropCardOnColumn(mockColumns, "col-1", "col-2", "card-1");

      expect(result[0].cards.length).toBe(2);
      expect(result[0].cards.find((c) => c.id === "card-1")).toBeUndefined();

      expect(result[1].cards.length).toBe(3);
      expect(result[1].cards[0].id).toBe("card-1");
      expect(result[1].cards[1].id).toBe("card-4");
    });

    it("appends columnHistory on cross-column drop", () => {
      const result = dropCardOnColumn(mockColumns, "col-1", "col-2", "card-1");
      const movedCard = result[1].cards.find((c) => c.id === "card-1")!;
      expect(movedCard.columnHistory).toHaveLength(2);
      expect(movedCard.columnHistory[1]).toEqual({
        columnId: "col-2",
        enteredAt: NOW,
      });
    });

    it("moves card to empty column", () => {
      const result = dropCardOnColumn(mockColumns, "col-1", "col-3", "card-1");

      expect(result[0].cards.length).toBe(2);

      expect(result[2].cards.length).toBe(1);
      expect(result[2].cards[0].id).toBe("card-1");
    });

    it("returns original array when fromColumn not found", () => {
      const result = dropCardOnColumn(
        mockColumns,
        "non-existent",
        "col-2",
        "card-1",
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when toColumn not found", () => {
      const result = dropCardOnColumn(
        mockColumns,
        "col-1",
        "non-existent",
        "card-1",
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when card not found", () => {
      const result = dropCardOnColumn(
        mockColumns,
        "col-1",
        "col-2",
        "non-existent",
      );
      expect(result).toBe(mockColumns);
    });
  });
});
