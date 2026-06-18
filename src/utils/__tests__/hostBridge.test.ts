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
});
