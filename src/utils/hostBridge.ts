import type { BoardState } from "../board/types";

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
  window.parent.postMessage(message, "*");
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

export function requestInitFromHost(): Promise<InitPayload> {
  return new Promise<InitPayload>((resolve) => {
    const off = onHostMessage((type, payload) => {
      if (type === "host:init") {
        off();
        resolve(payload as InitPayload);
      }
    });
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
}
