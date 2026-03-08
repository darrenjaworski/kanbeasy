import { describe, it, expect, beforeEach, afterEach } from "vitest";
import "fake-indexeddb/auto";
import {
  openDatabase,
  kvGet,
  kvSet,
  kvGetBool,
  kvSetBool,
  kvRemove,
  kvGetAll,
  getBoard,
  saveBoard,
  importAll,
  clearAll,
  resetDb,
  isAvailable,
  flushPendingWrites,
  seedKv,
  seedBoard,
} from "../db";
import type { BoardState } from "../../board/types";

const EMPTY_BOARD: BoardState = { columns: [], archive: [] };

function makeBoardWithColumn(title: string): BoardState {
  const now = Date.now();
  return {
    columns: [
      {
        id: crypto.randomUUID(),
        title,
        cards: [],
        createdAt: now,
        updatedAt: now,
      },
    ],
    archive: [],
  };
}

// Clean up IndexedDB between tests
async function deleteDatabase(): Promise<void> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.deleteDatabase("kanbeasy");
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

describe("db", () => {
  beforeEach(async () => {
    resetDb();
    localStorage.clear();
    await deleteDatabase();
  });

  afterEach(() => {
    resetDb();
  });

  describe("openDatabase", () => {
    it("opens IndexedDB and creates object stores", async () => {
      await openDatabase();
      expect(isAvailable()).toBe(true);
    });

    it("populates caches from IndexedDB on open", async () => {
      // Seed IndexedDB directly, then close before openDatabase()
      const database = await new Promise<IDBDatabase>((resolve, reject) => {
        const req = indexedDB.open("kanbeasy", 1);
        req.onupgradeneeded = () => {
          const d = req.result;
          if (!d.objectStoreNames.contains("kv")) {
            d.createObjectStore("kv", { keyPath: "key" });
          }
          if (!d.objectStoreNames.contains("board")) {
            d.createObjectStore("board", { keyPath: "id" });
          }
        };
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
      });

      const tx = database.transaction(["kv", "board"], "readwrite");
      tx.objectStore("kv").put({ key: "test-key", value: "test-value" });
      tx.objectStore("board").put({ id: "default", state: EMPTY_BOARD });
      await new Promise((resolve) => {
        tx.oncomplete = resolve;
      });
      database.close();

      await openDatabase();
      expect(kvGet("test-key", null)).toBe("test-value");
      expect(getBoard()).toEqual(EMPTY_BOARD);
    });

    it("migrates from localStorage on first use", async () => {
      const board = makeBoardWithColumn("Test");
      localStorage.setItem("kanbeasy:board", JSON.stringify(board));
      localStorage.setItem("kanbeasy:theme", "dark-slate");
      localStorage.setItem("kanbeasy:cardDensity", "large");

      await openDatabase();

      expect(getBoard()).toEqual(board);
      expect(kvGet("kanbeasy:theme", "")).toBe("dark-slate");
      expect(kvGet("kanbeasy:cardDensity", "")).toBe("large");
    });

    it("clears localStorage on second load after migration", async () => {
      // First load: migrate
      const board = makeBoardWithColumn("Test");
      localStorage.setItem("kanbeasy:board", JSON.stringify(board));
      await openDatabase();

      // Verify migration marker is set
      expect(kvGet("_migrated_from_localstorage", false)).toBe(true);

      // Close and reset caches (simulating page reload)
      resetDb();

      // localStorage still has data after first migration
      localStorage.setItem("kanbeasy:board", JSON.stringify(board));

      // Second load: should clear localStorage
      await openDatabase();
      expect(localStorage.getItem("kanbeasy:board")).toBeNull();
    });
  });

  describe("kvGet / kvSet / kvRemove", () => {
    it("returns fallback when key does not exist", () => {
      expect(kvGet("nonexistent", "default")).toBe("default");
    });

    it("stores and retrieves values", () => {
      kvSet("key1", "value1");
      expect(kvGet("key1", null)).toBe("value1");
    });

    it("handles complex objects", () => {
      const obj = { nested: { deep: true }, list: [1, 2, 3] };
      kvSet("complex", obj);
      expect(kvGet("complex", null)).toEqual(obj);
    });

    it("removes values", () => {
      kvSet("key1", "value1");
      kvRemove("key1");
      expect(kvGet("key1", "fallback")).toBe("fallback");
    });
  });

  describe("kvGetAll", () => {
    it("returns all cached kv entries", () => {
      kvSet("a", 1);
      kvSet("b", "two");
      kvSet("c", true);

      const all = kvGetAll();
      expect(all).toEqual({ a: 1, b: "two", c: true });
    });

    it("returns empty object when cache is empty", () => {
      expect(kvGetAll()).toEqual({});
    });
  });

  describe("getBoard / saveBoard", () => {
    it("returns null when no board is cached", () => {
      expect(getBoard()).toBeNull();
    });

    it("stores and retrieves board state", () => {
      const board = makeBoardWithColumn("Test");
      saveBoard(board);
      expect(getBoard()).toEqual(board);
    });

    it("supports multiple board IDs", () => {
      const board1 = makeBoardWithColumn("Board 1");
      const board2 = makeBoardWithColumn("Board 2");

      saveBoard(board1, "board-1");
      saveBoard(board2, "board-2");

      expect(getBoard("board-1")).toEqual(board1);
      expect(getBoard("board-2")).toEqual(board2);
    });
  });

  describe("write coalescing", () => {
    it("debounces board writes", async () => {
      await openDatabase();

      const board1 = makeBoardWithColumn("V1");
      const board2 = makeBoardWithColumn("V2");
      const board3 = makeBoardWithColumn("V3");

      // Rapid writes
      saveBoard(board1);
      saveBoard(board2);
      saveBoard(board3);

      // Flush immediately
      flushPendingWrites();

      // Verify final state in cache
      expect(getBoard()).toEqual(board3);
    });
  });

  describe("importAll", () => {
    it("replaces all cached data", async () => {
      await openDatabase();

      kvSet("old-key", "old-value");
      saveBoard(makeBoardWithColumn("Old"));

      const newBoard = makeBoardWithColumn("New");
      await importAll({
        kv: { "new-key": "new-value" },
        board: newBoard,
      });

      expect(kvGet("old-key", "gone")).toBe("gone");
      expect(kvGet("new-key", null)).toBe("new-value");
      expect(getBoard()).toEqual(newBoard);
    });
  });

  describe("clearAll", () => {
    it("clears all cached data", async () => {
      await openDatabase();

      kvSet("key", "value");
      saveBoard(makeBoardWithColumn("Test"));

      await clearAll();

      expect(kvGet("key", "gone")).toBe("gone");
      expect(getBoard()).toBeNull();
    });
  });

  describe("kvGetBool / kvSetBool", () => {
    it("returns fallback when key does not exist", () => {
      expect(kvGetBool("nonexistent", true)).toBe(true);
      expect(kvGetBool("nonexistent", false)).toBe(false);
    });

    it("returns true when stored value is 'true'", () => {
      kvSet("flag", "true");
      expect(kvGetBool("flag", false)).toBe(true);
    });

    it("returns false when stored value is 'false'", () => {
      kvSet("flag", "false");
      expect(kvGetBool("flag", true)).toBe(false);
    });

    it("stores 'true'/'false' strings", () => {
      kvSetBool("enabled", true);
      expect(kvGet("enabled", null)).toBe("true");

      kvSetBool("enabled", false);
      expect(kvGet("enabled", null)).toBe("false");
    });

    it("works with kvSetBool round-trip", () => {
      kvSetBool("a", true);
      kvSetBool("b", false);

      expect(kvGetBool("a", false)).toBe(true);
      expect(kvGetBool("b", true)).toBe(false);
    });
  });

  describe("IDB persistence round-trip", () => {
    it("kv data survives cache reset + re-open", async () => {
      await openDatabase();
      kvSet("persist-key", "persist-value");

      // Reset in-memory caches and re-open — IDB should repopulate
      resetDb();
      await openDatabase();

      expect(kvGet("persist-key", "gone")).toBe("persist-value");
    });

    it("board data survives cache reset + re-open", async () => {
      await openDatabase();
      const board = makeBoardWithColumn("Persistent");
      saveBoard(board);
      flushPendingWrites();

      // Reset in-memory caches and re-open — IDB should repopulate
      resetDb();
      await openDatabase();

      expect(getBoard()).toEqual(board);
    });
  });

  describe("migration of corrupt localStorage data", () => {
    it("skips corrupt board data gracefully", async () => {
      localStorage.setItem("kanbeasy:board", "{not valid json!!!");

      await openDatabase();

      // Board should not have been migrated
      expect(getBoard()).toBeNull();
    });

    it("migrates valid kv even when board data is corrupt", async () => {
      localStorage.setItem("kanbeasy:board", "{not valid json!!!");
      localStorage.setItem("kanbeasy:theme", "dark-slate");
      localStorage.setItem("kanbeasy:cardDensity", "large");

      await openDatabase();

      // Board should not have been migrated
      expect(getBoard()).toBeNull();
      // KV settings should still have been migrated
      expect(kvGet("kanbeasy:theme", "")).toBe("dark-slate");
      expect(kvGet("kanbeasy:cardDensity", "")).toBe("large");
    });
  });

  describe("test helpers", () => {
    it("seedKv populates cache without IDB", () => {
      seedKv("test", 42);
      expect(kvGet("test", 0)).toBe(42);
    });

    it("seedBoard populates cache without IDB", () => {
      const board = makeBoardWithColumn("Seeded");
      seedBoard(board);
      expect(getBoard()).toEqual(board);
    });

    it("resetDb clears everything", () => {
      seedKv("test", "value");
      seedBoard(EMPTY_BOARD);
      resetDb();
      expect(kvGet("test", "gone")).toBe("gone");
      expect(getBoard()).toBeNull();
    });
  });
});
