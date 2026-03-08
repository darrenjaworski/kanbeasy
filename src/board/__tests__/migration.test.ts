import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  migrateCard,
  migrateColumn,
  migrateColumns,
  migrateColumnsWithNumbering,
  resetCardTypeLookup,
} from "../migration";
import { seedKv } from "../../utils/db";
import { STORAGE_KEYS } from "../../constants/storage";

describe("migration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
    resetCardTypeLookup();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  const NOW = new Date("2025-06-15T12:00:00Z").getTime();

  describe("migrateCard", () => {
    it("backfills timestamps and columnHistory on legacy card", () => {
      const raw = { id: "card-1", title: "Task 1" };
      const result = migrateCard(raw, "col-1");

      expect(result).toEqual({
        id: "card-1",
        number: 0,
        title: "Task 1",
        description: "",
        cardTypeId: null,
        dueDate: null,
        createdAt: NOW,
        updatedAt: NOW,
        columnHistory: [{ columnId: "col-1", enteredAt: NOW }],
      });
    });

    it("preserves existing timestamps", () => {
      const raw = {
        id: "card-1",
        title: "Task 1",
        createdAt: 1000,
        updatedAt: 2000,
      };
      const result = migrateCard(raw, "col-1");

      expect(result.createdAt).toBe(1000);
      expect(result.updatedAt).toBe(2000);
    });

    it("preserves existing columnHistory", () => {
      const history = [
        { columnId: "col-a", enteredAt: 500 },
        { columnId: "col-b", enteredAt: 1000 },
      ];
      const raw = {
        id: "card-1",
        title: "Task 1",
        columnHistory: history,
      };
      const result = migrateCard(raw, "col-1");

      expect(result.columnHistory).toEqual(history);
    });

    it("is idempotent on already-migrated data", () => {
      const migrated = {
        id: "card-1",
        number: 5,
        title: "Task 1",
        description: "Some notes",
        cardTypeId: null,
        dueDate: null,
        createdAt: 1000,
        updatedAt: 2000,
        columnHistory: [{ columnId: "col-1", enteredAt: 1000 }],
      };
      const result = migrateCard(migrated, "col-1");

      expect(result).toEqual(migrated);
    });

    it("backfills description and number when missing", () => {
      const raw = {
        id: "card-1",
        title: "Task 1",
        createdAt: 1000,
        updatedAt: 2000,
      };
      const result = migrateCard(raw, "col-1");
      expect(result.description).toBe("");
      expect(result.number).toBe(0);
    });

    it("backfills cardTypeId to null when missing", () => {
      const raw = { id: "card-1", title: "Task 1" };
      const result = migrateCard(raw, "col-1");
      expect(result.cardTypeId).toBeNull();
    });

    it("preserves existing cardTypeId", () => {
      const raw = {
        id: "card-1",
        title: "Task 1",
        cardTypeId: "feat",
        createdAt: 1000,
        updatedAt: 2000,
      };
      const result = migrateCard(raw, "col-1");
      expect(result.cardTypeId).toBe("feat");
    });

    it("preserves existing description", () => {
      const raw = {
        id: "card-1",
        title: "Task 1",
        description: "Important notes",
        createdAt: 1000,
        updatedAt: 2000,
      };
      const result = migrateCard(raw, "col-1");
      expect(result.description).toBe("Important notes");
    });

    it("backfills dueDate to null when missing", () => {
      const raw = { id: "card-1", title: "Task 1" };
      const result = migrateCard(raw, "col-1");
      expect(result.dueDate).toBeNull();
    });

    it("preserves existing dueDate", () => {
      const raw = {
        id: "card-1",
        title: "Task 1",
        dueDate: "2025-12-31",
        createdAt: 1000,
        updatedAt: 2000,
      };
      const result = migrateCard(raw, "col-1");
      expect(result.dueDate).toBe("2025-12-31");
    });

    it("treats non-string dueDate as null", () => {
      const raw = {
        id: "card-1",
        title: "Task 1",
        dueDate: 12345,
      };
      const result = migrateCard(raw, "col-1");
      expect(result.dueDate).toBeNull();
    });

    it("preserves cardTypeLabel and cardTypeColor snapshot fields", () => {
      const raw = {
        id: "card-1",
        title: "Task 1",
        cardTypeId: "feat",
        cardTypeLabel: "Feature",
        cardTypeColor: "#22c55e",
        createdAt: 1000,
        updatedAt: 2000,
      };
      const result = migrateCard(raw, "col-1");
      expect(result.cardTypeLabel).toBe("Feature");
      expect(result.cardTypeColor).toBe("#22c55e");
    });

    it("backfills snapshot fields from presets for legacy cards with cardTypeId", () => {
      const raw = {
        id: "card-1",
        title: "Task 1",
        cardTypeId: "feat",
        createdAt: 1000,
        updatedAt: 2000,
      };
      const result = migrateCard(raw, "col-1");
      expect(result.cardTypeLabel).toBe("Feature");
      expect(result.cardTypeColor).toBe("#22c55e");
    });

    it("backfills snapshot fields from user's saved card types", () => {
      seedKv(STORAGE_KEYS.CARD_TYPES, [
        { id: "custom", label: "Custom Type", color: "#ff00ff" },
      ]);
      const raw = {
        id: "card-1",
        title: "Task 1",
        cardTypeId: "custom",
        createdAt: 1000,
        updatedAt: 2000,
      };
      const result = migrateCard(raw, "col-1");
      expect(result.cardTypeLabel).toBe("Custom Type");
      expect(result.cardTypeColor).toBe("#ff00ff");
    });

    it("omits snapshot fields when cardTypeId is unknown", () => {
      const raw = {
        id: "card-1",
        title: "Task 1",
        cardTypeId: "nonexistent",
        createdAt: 1000,
        updatedAt: 2000,
      };
      const result = migrateCard(raw, "col-1");
      expect(result).not.toHaveProperty("cardTypeLabel");
      expect(result).not.toHaveProperty("cardTypeColor");
    });

    it("ignores non-string snapshot fields and backfills from presets", () => {
      const raw = {
        id: "card-1",
        title: "Task 1",
        cardTypeId: "fix",
        cardTypeLabel: 42,
        cardTypeColor: true,
      };
      const result = migrateCard(raw, "col-1");
      expect(result.cardTypeLabel).toBe("Fix");
      expect(result.cardTypeColor).toBe("#ef4444");
    });
  });

  describe("migrateColumn", () => {
    it("backfills timestamps on legacy column", () => {
      const raw = {
        id: "col-1",
        title: "To Do",
        cards: [{ id: "card-1", title: "Task 1" }],
      };
      const result = migrateColumn(raw);

      expect(result.createdAt).toBe(NOW);
      expect(result.updatedAt).toBe(NOW);
    });

    it("preserves existing column timestamps", () => {
      const raw = {
        id: "col-1",
        title: "To Do",
        cards: [],
        createdAt: 1000,
        updatedAt: 2000,
      };
      const result = migrateColumn(raw);

      expect(result.createdAt).toBe(1000);
      expect(result.updatedAt).toBe(2000);
    });

    it("migrates all child cards with correct columnId", () => {
      const raw = {
        id: "col-1",
        title: "To Do",
        cards: [
          { id: "card-1", title: "Task 1" },
          { id: "card-2", title: "Task 2" },
        ],
      };
      const result = migrateColumn(raw);

      expect(result.cards).toHaveLength(2);
      expect(result.cards[0].columnHistory).toEqual([
        { columnId: "col-1", enteredAt: NOW },
      ]);
      expect(result.cards[1].columnHistory).toEqual([
        { columnId: "col-1", enteredAt: NOW },
      ]);
    });

    it("handles missing cards array", () => {
      const raw = { id: "col-1", title: "To Do" };
      const result = migrateColumn(raw);

      expect(result.cards).toEqual([]);
    });
  });

  describe("migrateColumns", () => {
    it("migrates all columns in array", () => {
      const raw = [
        {
          id: "col-1",
          title: "To Do",
          cards: [{ id: "card-1", title: "Task 1" }],
        },
        {
          id: "col-2",
          title: "Done",
          cards: [],
        },
      ];
      const result = migrateColumns(raw);

      expect(result).toHaveLength(2);
      expect(result[0].createdAt).toBe(NOW);
      expect(result[1].createdAt).toBe(NOW);
      expect(result[0].cards[0].columnHistory[0].columnId).toBe("col-1");
    });
  });

  describe("migrateColumnsWithNumbering", () => {
    it("assigns sequential numbers by createdAt order", () => {
      const raw = [
        {
          id: "col-1",
          title: "To Do",
          cards: [
            { id: "card-a", title: "Second", createdAt: 2000, updatedAt: 2000 },
            { id: "card-b", title: "First", createdAt: 1000, updatedAt: 1000 },
          ],
        },
      ];
      const { columns, nextCardNumber } = migrateColumnsWithNumbering(raw);

      // card-b (createdAt=1000) should be #1, card-a (createdAt=2000) should be #2
      const cardB = columns[0].cards.find((c) => c.id === "card-b")!;
      const cardA = columns[0].cards.find((c) => c.id === "card-a")!;
      expect(cardB.number).toBe(1);
      expect(cardA.number).toBe(2);
      expect(nextCardNumber).toBe(3);
    });

    it("is idempotent on already-numbered cards", () => {
      const raw = [
        {
          id: "col-1",
          title: "To Do",
          cards: [
            {
              id: "card-a",
              title: "A",
              number: 5,
              createdAt: 1000,
              updatedAt: 1000,
            },
            {
              id: "card-b",
              title: "B",
              number: 10,
              createdAt: 2000,
              updatedAt: 2000,
            },
          ],
        },
      ];
      const { columns, nextCardNumber } = migrateColumnsWithNumbering(raw);

      expect(columns[0].cards.find((c) => c.id === "card-a")!.number).toBe(5);
      expect(columns[0].cards.find((c) => c.id === "card-b")!.number).toBe(10);
      expect(nextCardNumber).toBe(11);
    });

    it("returns nextCardNumber=1 for empty columns", () => {
      const { columns, nextCardNumber } = migrateColumnsWithNumbering([
        { id: "col-1", title: "Empty", cards: [] },
      ]);
      expect(columns).toHaveLength(1);
      expect(nextCardNumber).toBe(1);
    });

    it("breaks createdAt ties by column index then card index", () => {
      const raw = [
        {
          id: "col-1",
          title: "A",
          cards: [
            { id: "card-1", title: "A1", createdAt: 1000, updatedAt: 1000 },
          ],
        },
        {
          id: "col-2",
          title: "B",
          cards: [
            { id: "card-2", title: "B1", createdAt: 1000, updatedAt: 1000 },
          ],
        },
      ];
      const { columns } = migrateColumnsWithNumbering(raw);

      // Same createdAt — col-1 card should get lower number
      const card1 = columns[0].cards[0];
      const card2 = columns[1].cards[0];
      expect(card1.number).toBeLessThan(card2.number);
    });
  });
});
