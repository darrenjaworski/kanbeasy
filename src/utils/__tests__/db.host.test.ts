import "fake-indexeddb/auto";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  openDatabase,
  getBoard,
  saveBoard,
  kvGet,
  kvSet,
  kvRemove,
  flushPendingWrites,
  resetDb,
  subscribeToExternalBoardChange,
} from "../db";
import {
  MESSAGE_SOURCE,
  PROTOCOL_VERSION,
  setHostModeForTesting,
  resetHostBridgeForTesting,
} from "../hostBridge";
import { HOST_INIT_TIMEOUT_MS } from "../../constants/behavior";
import type { BoardState } from "../../board/types";

const BOARD: BoardState = {
  columns: [
    { id: "c1", title: "To Do", cards: [], createdAt: 1, updatedAt: 1 },
  ],
  archive: [],
};

function dispatchHostMessage(type: string, payload: unknown) {
  window.dispatchEvent(
    new MessageEvent("message", {
      data: {
        source: MESSAGE_SOURCE,
        protocolVersion: PROTOCOL_VERSION,
        type,
        payload,
      },
    }),
  );
}

describe("db host backend", () => {
  beforeEach(() => {
    resetDb();
    resetHostBridgeForTesting();
    setHostModeForTesting(true);
  });
  afterEach(() => {
    resetDb();
    resetHostBridgeForTesting();
    setHostModeForTesting(false);
  });

  it("openDatabase hydrates cache from host:init instead of IndexedDB", async () => {
    const promise = openDatabase();
    dispatchHostMessage("host:init", {
      board: BOARD,
      kv: { "kanbeasy:theme": "dark" },
    });
    await promise;

    expect(getBoard()).toEqual(BOARD);
    expect(kvGet("kanbeasy:theme", "")).toBe("dark");
  });

  it("saveBoard writes through to the host as host:saveBoard", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    saveBoard(BOARD);
    flushPendingWrites();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "host:saveBoard",
        payload: { state: BOARD },
      }),
      "*",
    );
    spy.mockRestore();
  });

  it("kvSet and kvRemove write through to the host", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    kvSet("kanbeasy:theme", "dark");
    kvRemove("kanbeasy:theme");
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "host:kvSet",
        payload: { key: "kanbeasy:theme", value: "dark" },
      }),
      "*",
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "host:kvRemove",
        payload: { key: "kanbeasy:theme" },
      }),
      "*",
    );
    spy.mockRestore();
  });

  it("subscribeToExternalBoardChange fires on host:boardChanged", () => {
    const calls: Array<[BoardState, number]> = [];
    const off = subscribeToExternalBoardChange((state, n) =>
      calls.push([state, n]),
    );
    dispatchHostMessage("host:boardChanged", {
      state: BOARD,
      nextCardNumber: 7,
    });
    expect(calls).toEqual([[BOARD, 7]]);
    off();
  });

  it("openDatabase resolves with an empty board when host:init never arrives", async () => {
    vi.useFakeTimers();
    try {
      const promise = openDatabase();
      await vi.advanceTimersByTimeAsync(HOST_INIT_TIMEOUT_MS);
      // Resolves instead of hanging; no board was seeded, so the caller
      // (BoardProvider) creates a default board from getBoard() === null.
      await expect(promise).resolves.toBeUndefined();
      expect(getBoard()).toBeNull();
    } finally {
      vi.useRealTimers();
    }
  });
});

const IDB_BOARD: BoardState = {
  columns: [
    {
      id: "idb-col-1",
      title: "Backlog",
      cards: [],
      createdAt: 100,
      updatedAt: 100,
    },
  ],
  archive: [],
};

async function seedIndexedDb(
  board: BoardState,
  kv: Record<string, unknown>,
): Promise<void> {
  await new Promise<void>((resolve, reject) => {
    const req = indexedDB.open("kanbeasy", 1);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("kv")) {
        db.createObjectStore("kv", { keyPath: "key" });
      }
      if (!db.objectStoreNames.contains("board")) {
        db.createObjectStore("board", { keyPath: "id" });
      }
    };
    req.onsuccess = () => {
      const db = req.result;
      const tx = db.transaction(["board", "kv"], "readwrite");
      tx.objectStore("board").put({ id: "default", state: board });
      for (const [key, value] of Object.entries(kv)) {
        tx.objectStore("kv").put({ key, value });
      }
      tx.oncomplete = () => {
        db.close();
        resolve();
      };
      tx.onerror = () => reject(tx.error);
    };
    req.onerror = () => reject(req.error);
  });
}

describe("db host backend — IDB migration on first run", () => {
  beforeEach(() => {
    resetDb();
    resetHostBridgeForTesting();
    setHostModeForTesting(true);
  });
  afterEach(async () => {
    resetDb();
    resetHostBridgeForTesting();
    setHostModeForTesting(false);
    // Delete the fake-indexeddb "kanbeasy" database so each test starts clean
    await new Promise<void>((resolve) => {
      const req = indexedDB.deleteDatabase("kanbeasy");
      req.onsuccess = () => resolve();
      req.onerror = () => resolve();
    });
  });

  it("migrates IDB board + kv to host when isFirstRun is true", async () => {
    await seedIndexedDb(IDB_BOARD, {
      "kanbeasy:nextCardNumber": 5,
      "kanbeasy:theme": "dark",
    });

    const spy = vi.spyOn(window.parent, "postMessage");
    const promise = openDatabase();
    dispatchHostMessage("host:init", {
      board: { columns: [], archive: [] },
      kv: { "kanbeasy:nextCardNumber": 1 },
      isFirstRun: true,
    });
    await promise;

    // Cache should reflect IDB data, not the empty init board
    expect(getBoard()).toEqual(IDB_BOARD);
    expect(kvGet("kanbeasy:nextCardNumber", 0)).toBe(5);
    expect(kvGet("kanbeasy:theme", "")).toBe("dark");

    // Extension should have received the migration data
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "host:saveBoard",
        payload: { state: IDB_BOARD },
      }),
      expect.any(String),
    );
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({
        type: "host:kvSet",
        payload: { key: "kanbeasy:nextCardNumber", value: 5 },
      }),
      expect.any(String),
    );
    spy.mockRestore();
  });

  it("falls back to init board when isFirstRun is true but IDB is empty", async () => {
    const INIT_BOARD: BoardState = {
      columns: [
        {
          id: "default-col",
          title: "To Do",
          cards: [],
          createdAt: 1,
          updatedAt: 1,
        },
      ],
      archive: [],
    };
    const spy = vi.spyOn(window.parent, "postMessage");
    const promise = openDatabase();
    dispatchHostMessage("host:init", {
      board: INIT_BOARD,
      kv: { "kanbeasy:nextCardNumber": 1 },
      isFirstRun: true,
    });
    await promise;

    // No IDB data → use the init payload as-is
    expect(getBoard()).toEqual(INIT_BOARD);
    // Should NOT have posted saveBoard (no migration)
    expect(spy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "host:saveBoard" }),
      expect.any(String),
    );
    spy.mockRestore();
  });

  it("skips IDB migration when isFirstRun is false", async () => {
    await seedIndexedDb(IDB_BOARD, { "kanbeasy:nextCardNumber": 42 });

    const INIT_BOARD: BoardState = { columns: [], archive: [] };
    const spy = vi.spyOn(window.parent, "postMessage");
    const promise = openDatabase();
    dispatchHostMessage("host:init", {
      board: INIT_BOARD,
      kv: { "kanbeasy:nextCardNumber": 10 },
      isFirstRun: false,
    });
    await promise;

    // Should use globalState (init payload), not IDB
    expect(getBoard()).toEqual(INIT_BOARD);
    expect(kvGet("kanbeasy:nextCardNumber", 0)).toBe(10);
    expect(spy).not.toHaveBeenCalledWith(
      expect.objectContaining({ type: "host:saveBoard" }),
      expect.any(String),
    );
    spy.mockRestore();
  });
});
