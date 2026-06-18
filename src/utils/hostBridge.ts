import type { BoardState } from "../board/types";
import { HOST_INIT_TIMEOUT_MS } from "../constants/behavior";

export const MESSAGE_SOURCE = "kanbeasy";
export const PROTOCOL_VERSION = 1;

export type InitPayload = {
  board: BoardState;
  kv: Record<string, unknown>;
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
  window.parent.postMessage(message, trustedOrigin ?? "*");
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

// --- Test helpers ---

export function setHostModeForTesting(value: boolean): void {
  hostMode = value;
}

export function resetHostBridgeForTesting(): void {
  listeners.clear();
  if (listening && typeof window !== "undefined") {
    window.removeEventListener("message", onMessage);
  }
  listening = false;
  trustedOrigin = null;
}
