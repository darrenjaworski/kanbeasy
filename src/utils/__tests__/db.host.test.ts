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
