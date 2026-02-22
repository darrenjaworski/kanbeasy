import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { migrateCard, migrateColumn, migrateColumns } from "../migration";

describe("migration", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2025-06-15T12:00:00Z"));
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
        title: "Task 1",
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
        title: "Task 1",
        createdAt: 1000,
        updatedAt: 2000,
        columnHistory: [{ columnId: "col-1", enteredAt: 1000 }],
      };
      const result = migrateCard(migrated, "col-1");

      expect(result).toEqual(migrated);
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
});
