import { describe, it, expect } from "vitest";
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

describe("dragUtils", () => {
  const mockColumns: Column[] = [
    {
      id: "col-1",
      title: "Column 1",
      cards: [
        { id: "card-1", title: "Card 1" },
        { id: "card-2", title: "Card 2" },
        { id: "card-3", title: "Card 3" },
      ],
    },
    {
      id: "col-2",
      title: "Column 2",
      cards: [
        { id: "card-4", title: "Card 4" },
        { id: "card-5", title: "Card 5" },
      ],
    },
    {
      id: "col-3",
      title: "Column 3",
      cards: [],
    },
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
      expect(card).toEqual({ id: "card-1", title: "Card 1" });
    });

    it("finds card in the second column", () => {
      const card = findCardInColumns(mockColumns, "card-4");
      expect(card).toEqual({ id: "card-4", title: "Card 4" });
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

    it("returns original array when oldIndex equals newIndex", () => {
      const result = reorderColumns(mockColumns, "col-1", "col-1");
      expect(result).toBe(mockColumns);
    });

    it("returns original array when column not found", () => {
      const result = reorderColumns(mockColumns, "non-existent", "col-2");
      expect(result).toBe(mockColumns);
    });
  });

  describe("moveCardWithinColumn", () => {
    it("reorders cards within the same column", () => {
      // Moving card-1 (index 0) to card-3's position (index 2)
      // arrayMove([card-1, card-2, card-3], 0, 2) -> [card-2, card-3, card-1]
      const result = moveCardWithinColumn(
        mockColumns,
        "col-1",
        "card-1",
        "card-3"
      );
      expect(result[0].cards[0].id).toBe("card-2");
      expect(result[0].cards[1].id).toBe("card-3");
      expect(result[0].cards[2].id).toBe("card-1");
    });

    it("returns original array when column not found", () => {
      const result = moveCardWithinColumn(
        mockColumns,
        "non-existent",
        "card-1",
        "card-2"
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when card not found", () => {
      const result = moveCardWithinColumn(
        mockColumns,
        "col-1",
        "non-existent",
        "card-2"
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when cards are the same", () => {
      const result = moveCardWithinColumn(
        mockColumns,
        "col-1",
        "card-1",
        "card-1"
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
        "card-4"
      );

      // card-1 should be removed from col-1
      expect(result[0].cards.length).toBe(2);
      expect(result[0].cards.find((c) => c.id === "card-1")).toBeUndefined();

      // card-1 should be in col-2 at the position of card-4
      expect(result[1].cards.length).toBe(3);
      expect(result[1].cards[0].id).toBe("card-1");
      expect(result[1].cards[1].id).toBe("card-4");
    });

    it("moves card to end when overCardId not found", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "col-1",
        "col-2",
        "card-1",
        "non-existent"
      );

      // card-1 should be at the end of col-2
      expect(result[1].cards.length).toBe(3);
      expect(result[1].cards[2].id).toBe("card-1");
    });

    it("returns original array when fromColumn not found", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "non-existent",
        "col-2",
        "card-1",
        "card-4"
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when toColumn not found", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "col-1",
        "non-existent",
        "card-1",
        "card-4"
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when card not found", () => {
      const result = moveCardAcrossColumns(
        mockColumns,
        "col-1",
        "col-2",
        "non-existent",
        "card-4"
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

    it("moves card to beginning when dropped in different column", () => {
      const result = dropCardOnColumn(mockColumns, "col-1", "col-2", "card-1");

      // card-1 removed from col-1
      expect(result[0].cards.length).toBe(2);
      expect(result[0].cards.find((c) => c.id === "card-1")).toBeUndefined();

      // card-1 at beginning of col-2
      expect(result[1].cards.length).toBe(3);
      expect(result[1].cards[0].id).toBe("card-1");
      expect(result[1].cards[1].id).toBe("card-4");
    });

    it("moves card to empty column", () => {
      const result = dropCardOnColumn(mockColumns, "col-1", "col-3", "card-1");

      // card-1 removed from col-1
      expect(result[0].cards.length).toBe(2);

      // card-1 in col-3
      expect(result[2].cards.length).toBe(1);
      expect(result[2].cards[0].id).toBe("card-1");
    });

    it("returns original array when fromColumn not found", () => {
      const result = dropCardOnColumn(
        mockColumns,
        "non-existent",
        "col-2",
        "card-1"
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when toColumn not found", () => {
      const result = dropCardOnColumn(
        mockColumns,
        "col-1",
        "non-existent",
        "card-1"
      );
      expect(result).toBe(mockColumns);
    });

    it("returns original array when card not found", () => {
      const result = dropCardOnColumn(
        mockColumns,
        "col-1",
        "col-2",
        "non-existent"
      );
      expect(result).toBe(mockColumns);
    });
  });
});
