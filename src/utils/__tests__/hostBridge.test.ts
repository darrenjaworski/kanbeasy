import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  MESSAGE_SOURCE,
  PROTOCOL_VERSION,
  isHostMode,
  setHostModeForTesting,
  postToHost,
  onHostMessage,
  requestInitFromHost,
  resetHostBridgeForTesting,
} from "../hostBridge";

function dispatchHostMessage(type: string, payload: unknown, origin = "") {
  window.dispatchEvent(
    new MessageEvent("message", {
      origin,
      data: {
        source: MESSAGE_SOURCE,
        protocolVersion: PROTOCOL_VERSION,
        type,
        payload,
      },
    }),
  );
}

describe("hostBridge", () => {
  beforeEach(() => {
    setHostModeForTesting(false);
    resetHostBridgeForTesting();
  });
  afterEach(() => {
    resetHostBridgeForTesting();
    setHostModeForTesting(false);
  });

  it("defaults to non-host mode", () => {
    expect(isHostMode()).toBe(false);
  });

  it("setHostModeForTesting toggles host mode", () => {
    setHostModeForTesting(true);
    expect(isHostMode()).toBe(true);
  });

  it("postToHost posts a wrapped, versioned message to the parent", () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    postToHost("host:saveBoard", { state: 1 });
    expect(spy).toHaveBeenCalledWith(
      {
        source: MESSAGE_SOURCE,
        protocolVersion: PROTOCOL_VERSION,
        type: "host:saveBoard",
        payload: { state: 1 },
      },
      "*",
    );
    spy.mockRestore();
  });

  it("onHostMessage delivers matching messages and ignores foreign ones", () => {
    const received: Array<[string, unknown]> = [];
    const off = onHostMessage((type, payload) =>
      received.push([type, payload]),
    );

    dispatchHostMessage("host:boardChanged", { hello: true });
    window.dispatchEvent(
      new MessageEvent("message", { data: { source: "other", type: "x" } }),
    );

    expect(received).toEqual([["host:boardChanged", { hello: true }]]);
    off();
    dispatchHostMessage("host:boardChanged", { again: true });
    expect(received).toHaveLength(1);
  });

  it("requestInitFromHost posts host:ready and resolves on host:init", async () => {
    const spy = vi.spyOn(window.parent, "postMessage");
    const promise = requestInitFromHost();
    expect(spy).toHaveBeenCalledWith(
      expect.objectContaining({ type: "host:ready" }),
      "*",
    );
    dispatchHostMessage("host:init", {
      board: { columns: [], archive: [] },
      kv: { a: 1 },
    });
    await expect(promise).resolves.toEqual({
      board: { columns: [], archive: [] },
      kv: { a: 1 },
    });
    spy.mockRestore();
  });

  it("pins the first message's origin and rejects later mismatched origins", () => {
    const received: Array<[string, unknown]> = [];
    onHostMessage((type, payload) => received.push([type, payload]));

    // First valid message establishes the trusted origin (trust-on-first-use).
    dispatchHostMessage("host:init", { ok: true }, "vscode-webview://abc");
    // A message from any other origin must be dropped.
    dispatchHostMessage(
      "host:boardChanged",
      { evil: true },
      "https://evil.test",
    );
    // Same trusted origin is still delivered.
    dispatchHostMessage(
      "host:boardChanged",
      { ok: true },
      "vscode-webview://abc",
    );

    expect(received).toEqual([
      ["host:init", { ok: true }],
      ["host:boardChanged", { ok: true }],
    ]);
  });

  it("targets the pinned origin for posts after the handshake", async () => {
    const spy = vi.spyOn(window.parent, "postMessage");

    // requestInitFromHost subscribes, then broadcasts the empty handshake "*".
    const promise = requestInitFromHost();
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "host:ready" }),
      "*",
    );

    // The host's reply pins its origin; data-carrying posts then target it.
    dispatchHostMessage(
      "host:init",
      { board: { columns: [], archive: [] }, kv: {} },
      "vscode-webview://abc",
    );
    await promise;
    postToHost("host:saveBoard", { state: 1 });
    expect(spy).toHaveBeenLastCalledWith(
      expect.objectContaining({ type: "host:saveBoard" }),
      "vscode-webview://abc",
    );
    spy.mockRestore();
  });

  it("requestInitFromHost rejects when host:init never arrives", async () => {
    vi.useFakeTimers();
    try {
      const promise = requestInitFromHost(1000);
      const assertion = expect(promise).rejects.toThrow(/host:init/);
      await vi.advanceTimersByTimeAsync(1000);
      await assertion;
    } finally {
      vi.useRealTimers();
    }
  });
});
