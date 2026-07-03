import type { BoardState } from "../board/types";
import {
  HOST_CLIPBOARD_READ_TIMEOUT_MS,
  HOST_INIT_TIMEOUT_MS,
} from "../constants/behavior";

export const MESSAGE_SOURCE = "kanbeasy";
export const PROTOCOL_VERSION = 1;

/**
 * Optional features the host advertises in `host:init`. Older extension
 * versions omit this entirely, so every capability defaults to "absent" —
 * features gated on a capability must stay inert until it is advertised.
 */
export type HostCapabilities = {
  clipboard?: boolean;
};

export type InitPayload = {
  board: BoardState;
  kv: Record<string, unknown>;
  isFirstRun?: boolean;
  capabilities?: HostCapabilities;
};

export type BoardChangedPayload = {
  state: BoardState;
  nextCardNumber: number;
};

type HostMessage = {
  source: typeof MESSAGE_SOURCE;
  protocolVersion: number;
  type: string;
  payload: unknown;
};

type Listener = (type: string, payload: unknown) => void;

const listeners = new Set<Listener>();
let listening = false;

// Origin of the parent (the VS Code webview relay), learned at handshake time.
// The webview's `vscode-webview://<uuid>` origin is per-session and cannot be
// known statically, so we trust the origin of the first valid message and
// reject everything from a different origin thereafter (trust-on-first-use).
let trustedOrigin: string | null = null;

function detectHostMode(): boolean {
  if (typeof window === "undefined") {
    return false;
  }
  try {
    return new URLSearchParams(window.location.search).get("host") === "vscode";
  } catch {
    return false;
  }
}

let hostMode = detectHostMode();

export function isHostMode(): boolean {
  return hostMode;
}

// --- Host capabilities (learned from host:init) ---

let capabilities: HostCapabilities = {};
const capabilityListeners = new Set<() => void>();

export function hasHostClipboard(): boolean {
  return capabilities.clipboard === true;
}

/** Subscribe to capability changes (useSyncExternalStore-compatible). */
export function subscribeHostCapabilities(listener: () => void): () => void {
  capabilityListeners.add(listener);
  return () => {
    capabilityListeners.delete(listener);
  };
}

function captureCapabilities(payload: unknown): void {
  const caps = (payload as InitPayload | undefined)?.capabilities;
  if (caps && typeof caps === "object") {
    capabilities = caps;
    for (const listener of capabilityListeners) {
      listener();
    }
  }
}

export function postToHost(type: string, payload: unknown): void {
  if (typeof window === "undefined") {
    return;
  }
  const message: HostMessage = {
    source: MESSAGE_SOURCE,
    protocolVersion: PROTOCOL_VERSION,
    type,
    payload,
  };
  // Once the host origin is known, target it directly so board/settings data is
  // never broadcast to an unexpected frame. Before the handshake the only post
  // is the empty `host:ready`, which carries no data and may be broadcast.
  window.parent.postMessage(message, trustedOrigin || "*");
}

function onMessage(event: MessageEvent): void {
  const data = event.data as Partial<HostMessage> | undefined;
  if (
    !data ||
    data.source !== MESSAGE_SOURCE ||
    typeof data.type !== "string"
  ) {
    return;
  }
  if (trustedOrigin === null) {
    trustedOrigin = event.origin; // pin the host origin on first valid message
  } else if (event.origin !== trustedOrigin) {
    return; // drop messages from any other origin
  }
  if (data.type === "host:init") {
    captureCapabilities(data.payload);
  }
  for (const listener of listeners) {
    listener(data.type, data.payload);
  }
}

function ensureListening(): void {
  if (listening || typeof window === "undefined") {
    return;
  }
  window.addEventListener("message", onMessage);
  listening = true;
}

export function onHostMessage(listener: Listener): () => void {
  ensureListening();
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function requestInitFromHost(
  timeoutMs: number = HOST_INIT_TIMEOUT_MS,
): Promise<InitPayload> {
  return new Promise<InitPayload>((resolve, reject) => {
    const off = onHostMessage((type, payload) => {
      if (type !== "host:init") return;
      cleanup();
      resolve(payload as InitPayload);
    });
    const timer = setTimeout(() => {
      cleanup();
      reject(new Error(`Timed out after ${timeoutMs}ms waiting for host:init`));
    }, timeoutMs);
    function cleanup(): void {
      clearTimeout(timer);
      off();
    }
    postToHost("host:ready", {});
  });
}

// --- Host-mediated clipboard ---
// The VS Code webview blocks navigator.clipboard in the nested cross-origin
// iframe (even with allow="clipboard-read; clipboard-write" delegation), so
// clipboard traffic is routed through the extension host, which uses
// vscode.env.clipboard and needs no browser permissions.

let clipboardRequestCounter = 0;

export function writeClipboardViaHost(text: string): void {
  postToHost("host:clipboard:write", { text });
}

export function readClipboardViaHost(
  timeoutMs: number = HOST_CLIPBOARD_READ_TIMEOUT_MS,
): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const requestId = `clipboard-${++clipboardRequestCounter}`;
    const off = onHostMessage((type, payload) => {
      if (type !== "host:clipboard:readResult") return;
      const result = payload as
        | { requestId?: string; text?: string }
        | undefined;
      if (!result || result.requestId !== requestId) return;
      cleanup();
      resolve(typeof result.text === "string" ? result.text : "");
    });
    const timer = setTimeout(() => {
      cleanup();
      reject(
        new Error(
          `Timed out after ${timeoutMs}ms waiting for host:clipboard:readResult`,
        ),
      );
    }, timeoutMs);
    function cleanup(): void {
      clearTimeout(timer);
      off();
    }
    postToHost("host:clipboard:read", { requestId });
  });
}

// --- Test helpers ---

export function setHostModeForTesting(value: boolean): void {
  hostMode = value;
}

export function setHostCapabilitiesForTesting(value: HostCapabilities): void {
  capabilities = value;
  for (const listener of capabilityListeners) {
    listener();
  }
}

export function resetHostBridgeForTesting(): void {
  listeners.clear();
  capabilityListeners.clear();
  capabilities = {};
  if (listening && typeof window !== "undefined") {
    window.removeEventListener("message", onMessage);
  }
  listening = false;
  trustedOrigin = null;
}
