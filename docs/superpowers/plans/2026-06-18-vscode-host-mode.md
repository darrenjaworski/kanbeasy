# VS Code Host-Mode Integration Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a "host mode" to the Kanbeasy web app so that, when embedded in the VS Code extension's webview, its storage is backed by the extension host via `postMessage` instead of IndexedDB — making the extension the single source of truth.

**Architecture:** A new `hostBridge.ts` owns host detection and the `postMessage` protocol. `db.ts` keeps its public API but swaps its backend (IndexedDB ↔ host) based on `isHostMode()`. `BoardProvider` subscribes to inbound external (MCP-originated) board changes and applies them via a new non-recording setter on `useUndoableState` so they stay out of the local undo stack. When not in host mode, behavior is byte-for-byte unchanged.

**Tech Stack:** TypeScript, React 19, Vitest + @testing-library/react, jsdom. Storage seam in `src/utils/db.ts`.

**Spec:** `docs/superpowers/specs/2026-06-18-vscode-host-mode-integration.md`

---

## File Structure

- **Create** `src/utils/hostBridge.ts` — host detection, protocol constants/types, `postToHost`, inbound message listener, `requestInitFromHost`, `onHostMessage`, test helpers.
- **Create** `src/utils/__tests__/hostBridge.test.ts` — unit tests for the bridge.
- **Modify** `src/utils/db.ts` — host backend branch in `openDatabase`; host-aware write sink in `flushBoardWrite`/`kvSet`/`kvRemove`; new `subscribeToExternalBoardChange`.
- **Create** `src/utils/__tests__/db.host.test.ts` — host-mode db tests (isolated so they can toggle host mode).
- **Modify** `src/board/useUndoableState.ts` — add non-recording `replaceState` setter.
- **Create** `src/__tests__/use-undoable-state.test.tsx` — tests for `replaceState`.
- **Modify** `src/board/BoardProvider.tsx` — subscribe to external board changes; skip echo-save.
- **Create** `src/__tests__/board-provider-host.test.tsx` — inbound update + no-echo test.
- **Modify** `CHANGELOG.md` — note the feature.

### Protocol contract (shared with the extension; keep in sync)

```ts
// hostBridge.ts
export const MESSAGE_SOURCE = "kanbeasy";
export const PROTOCOL_VERSION = 1;

export type InitPayload = {
  board: import("../board/types").BoardState;
  kv: Record<string, unknown>; // includes "kanbeasy:nextCardNumber"
};

export type BoardChangedPayload = {
  state: import("../board/types").BoardState;
  nextCardNumber: number;
};
```

> Note (refinement vs spec): `host:init` carries `{ board, kv }`. The next-card-number is read
> from `kv` under `STORAGE_KEYS.NEXT_CARD_NUMBER` (how `BoardProvider.loadState` already reads it),
> so no separate top-level field is needed at init. `host:boardChanged` carries an explicit
> `nextCardNumber` because external edits can advance the counter while the board is open.

---

## Task 1: hostBridge module

**Files:**

- Create: `src/utils/hostBridge.ts`
- Test: `src/utils/__tests__/hostBridge.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/__tests__/hostBridge.test.ts
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
    // Foreign source — must be ignored
    window.dispatchEvent(
      new MessageEvent("message", { data: { source: "other", type: "x" } }),
    );

    expect(received).toEqual([["host:boardChanged", { hello: true }]]);
    off();
    dispatchHostMessage("host:boardChanged", { again: true });
    expect(received).toHaveLength(1); // unsubscribed
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
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/utils/__tests__/hostBridge.test.ts`
Expected: FAIL — `Cannot find module '../hostBridge'`.

- [ ] **Step 3: Implement `hostBridge.ts`**

```ts
// src/utils/hostBridge.ts
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
  if (typeof window === "undefined") return false;
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
  if (typeof window === "undefined") return;
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
  if (listening || typeof window === "undefined") return;
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
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/hostBridge.test.ts`
Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add src/utils/hostBridge.ts src/utils/__tests__/hostBridge.test.ts
git commit -m "feat: add host bridge for VS Code postMessage protocol"
```

---

## Task 2: db.ts host backend

**Files:**

- Modify: `src/utils/db.ts`
- Test: `src/utils/__tests__/db.host.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/utils/__tests__/db.host.test.ts
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
});
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `npx vitest run src/utils/__tests__/db.host.test.ts`
Expected: FAIL — `subscribeToExternalBoardChange` is not exported / host branch not implemented.

- [ ] **Step 3: Add host imports and the subscription helper to `db.ts`**

At the top of `src/utils/db.ts`, add to the imports:

```ts
import {
  isHostMode,
  postToHost,
  onHostMessage,
  requestInitFromHost,
} from "./hostBridge";
import type { BoardChangedPayload, InitPayload } from "./hostBridge";
```

- [ ] **Step 4: Branch `openDatabase` into a host backend**

In `src/utils/db.ts`, at the very top of `openDatabase` (before the `indexedDB` check), add:

```ts
export async function openDatabase(): Promise<void> {
  if (isHostMode()) {
    await openHostBackend();
    return;
  }
  // ...existing IndexedDB implementation unchanged...
```

Then add this new function next to `openDatabase`:

```ts
async function openHostBackend(): Promise<void> {
  available = true;
  const init: InitPayload = await requestInitFromHost();
  applyInitToCache(init);
}

function applyInitToCache(init: InitPayload): void {
  kvCache.clear();
  for (const [key, value] of Object.entries(init.kv)) {
    kvCache.set(key, value);
  }
  boardCache[DEFAULT_BOARD_ID] = init.board;
}
```

- [ ] **Step 5: Make the write sinks host-aware**

In `flushBoardWrite`, replace the `idbPut` call so host mode posts instead:

```ts
function flushBoardWrite(): void {
  if (pendingBoardId === null) return;
  const id = pendingBoardId;
  pendingBoardId = null;
  boardWriteTimer = null;
  const state = boardCache[id];
  if (!state) return;
  if (isHostMode()) {
    postToHost("host:saveBoard", { state });
  } else {
    idbPut(BOARD_STORE, { id, state });
  }
}
```

In `kvSet`, replace the persistence line:

```ts
kvCache.set(key, value);
if (isHostMode()) {
  postToHost("host:kvSet", { key, value });
} else if (available) {
  idbPut(KV_STORE, { key, value });
}
```

In `kvRemove`, replace the persistence line:

```ts
kvCache.delete(key);
if (isHostMode()) {
  postToHost("host:kvRemove", { key });
} else if (available) {
  idbDelete(KV_STORE, key);
}
```

- [ ] **Step 6: Add `subscribeToExternalBoardChange` near the board operations**

```ts
export function subscribeToExternalBoardChange(
  callback: (state: BoardState, nextCardNumber: number) => void,
): () => void {
  if (!isHostMode()) {
    return () => {};
  }
  return onHostMessage((type, payload) => {
    if (type === "host:boardChanged") {
      const { state, nextCardNumber } = payload as BoardChangedPayload;
      boardCache[DEFAULT_BOARD_ID] = state;
      callback(state, nextCardNumber);
    }
  });
}
```

- [ ] **Step 7: Run the tests to verify they pass**

Run: `npx vitest run src/utils/__tests__/db.host.test.ts`
Expected: PASS (4 tests).

- [ ] **Step 8: Run the existing db suite to confirm no regression**

Run: `npx vitest run src/utils/__tests__/db.test.ts`
Expected: PASS (all existing tests — host mode is off there).

- [ ] **Step 9: Commit**

```bash
git add src/utils/db.ts src/utils/__tests__/db.host.test.ts
git commit -m "feat: back db.ts with VS Code host when in host mode"
```

---

## Task 3: non-recording setter on useUndoableState

**Files:**

- Modify: `src/board/useUndoableState.ts`
- Test: `src/__tests__/use-undoable-state.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/use-undoable-state.test.tsx
import { describe, it, expect } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useUndoableState } from "../board/useUndoableState";

describe("useUndoableState.replaceState", () => {
  it("replaces present without adding to undo history", () => {
    const { result } = renderHook(() => useUndoableState(0));

    act(() => result.current.setState(1)); // records history
    expect(result.current.canUndo).toBe(true);

    act(() => result.current.replaceState(99)); // non-recording
    expect(result.current.state).toBe(99);

    // History is unchanged: undo returns to the value before the recorded change (0),
    // NOT to 1 — replaceState did not push a history entry.
    act(() => result.current.undo());
    expect(result.current.state).toBe(0);
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/use-undoable-state.test.tsx`
Expected: FAIL — `result.current.replaceState is not a function`.

- [ ] **Step 3: Add `replaceState` to the hook**

In `src/board/useUndoableState.ts`, add to the return type:

```ts
type UseUndoableStateReturn<T> = {
  state: T;
  setState: React.Dispatch<React.SetStateAction<T>>;
  replaceState: (next: T) => void;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};
```

Add the implementation after `setState` (before `undo`):

```ts
const replaceState = useCallback((next: T) => {
  setHistory((prev) => {
    if (next === prev.present) return prev;
    return { past: prev.past, present: next, future: prev.future };
  });
}, []);
```

And include it in the returned object:

```ts
return {
  state: history.present,
  setState,
  replaceState,
  undo,
  redo,
  canUndo,
  canRedo,
};
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/use-undoable-state.test.tsx`
Expected: PASS.

- [ ] **Step 5: Commit**

```bash
git add src/board/useUndoableState.ts src/__tests__/use-undoable-state.test.tsx
git commit -m "feat: add non-recording replaceState to useUndoableState"
```

---

## Task 4: BoardProvider subscribes to external changes

**Files:**

- Modify: `src/board/BoardProvider.tsx`
- Test: `src/__tests__/board-provider-host.test.tsx`

- [ ] **Step 1: Write the failing test**

```tsx
// src/__tests__/board-provider-host.test.tsx
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, act } from "@testing-library/react";
import type { BoardState } from "../board/types";

// Capture the subscription callback and control loadState inputs.
let externalCb: ((state: BoardState, nextCardNumber: number) => void) | null =
  null;
const saveBoardMock = vi.fn();

const SEEDED: BoardState = {
  columns: [
    { id: "c1", title: "Seeded", cards: [], createdAt: 1, updatedAt: 1 },
  ],
  archive: [],
};
const EXTERNAL: BoardState = {
  columns: [
    { id: "c1", title: "Seeded", cards: [], createdAt: 1, updatedAt: 1 },
    { id: "c2", title: "Added by MCP", cards: [], createdAt: 2, updatedAt: 2 },
  ],
  archive: [],
};

vi.mock("../utils/db", async (importActual) => {
  const actual = await importActual<typeof import("../utils/db")>();
  return {
    ...actual,
    getBoard: vi.fn(() => SEEDED),
    saveBoard: (...args: unknown[]) => saveBoardMock(...args),
    kvGet: vi.fn((_key: string, fallback: unknown) => fallback),
    kvSet: vi.fn(),
    subscribeToExternalBoardChange: vi.fn(
      (cb: (state: BoardState, n: number) => void) => {
        externalCb = cb;
        return () => {
          externalCb = null;
        };
      },
    ),
  };
});

import { BoardProvider } from "../board/BoardProvider";
import { useBoard } from "../board/useBoard";

function ColumnCount() {
  const { columns } = useBoard();
  return <div data-testid="count">{columns.length}</div>;
}

describe("BoardProvider host integration", () => {
  beforeEach(() => {
    externalCb = null;
    saveBoardMock.mockClear();
  });

  it("applies external board changes and does not echo them back as a save", () => {
    render(
      <BoardProvider>
        <ColumnCount />
      </BoardProvider>,
    );

    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(externalCb).toBeTypeOf("function");

    act(() => externalCb!(EXTERNAL, 42));

    expect(screen.getByTestId("count").textContent).toBe("2");
    // The inbound change must NOT trigger a write-back to the host.
    expect(saveBoardMock).not.toHaveBeenCalled();
  });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `npx vitest run src/__tests__/board-provider-host.test.tsx`
Expected: FAIL — count stays "1" (no subscription wired) or `saveBoard` is called (echo).

- [ ] **Step 3: Wire the subscription in `BoardProvider`**

In `src/board/BoardProvider.tsx`, update the `db` import to add `subscribeToExternalBoardChange`:

```ts
import {
  kvGet,
  kvSet,
  getBoard,
  saveBoard,
  subscribeToExternalBoardChange,
} from "../utils/db";
```

Pull `replaceState` out of the hook:

```ts
const { state, setState, replaceState, undo, redo, canUndo, canRedo } =
  useUndoableState<BoardState>(() => loadResult.current!.state, {
    maxHistory: MAX_UNDO_HISTORY,
  });
```

Add an `externalStateRef` next to `initialStateRef`, and guard the save effect against echoing inbound state:

```ts
const initialStateRef = useRef(state);
const externalStateRef = useRef<BoardState | null>(null);
useEffect(() => {
  if (state === initialStateRef.current) return;
  if (state === externalStateRef.current) return; // inbound external change — do not echo
  saveBoard(state);
}, [state]);

// Apply external (MCP-originated) board changes pushed by the extension host.
useEffect(() => {
  return subscribeToExternalBoardChange((nextState, nextNumber) => {
    externalStateRef.current = nextState;
    nextCardNumberRef.current = nextNumber;
    replaceState(nextState);
  });
}, [replaceState]);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `npx vitest run src/__tests__/board-provider-host.test.tsx`
Expected: PASS — count becomes "2" and `saveBoard` is not called.

- [ ] **Step 5: Commit**

```bash
git add src/board/BoardProvider.tsx src/__tests__/board-provider-host.test.tsx
git commit -m "feat: apply external board changes from VS Code host in BoardProvider"
```

---

## Task 5: Full verification + changelog

**Files:**

- Modify: `CHANGELOG.md`

- [ ] **Step 1: Run the full test suite**

Run: `npm run test` (or `npx vitest run`)
Expected: PASS — all suites green, including the four new tests and all pre-existing tests.

- [ ] **Step 2: Type-check and lint**

Run: `npx tsc -p tsconfig.app.json --noEmit && npm run lint`
Expected: no type errors, no lint errors.

- [ ] **Step 3: Add a CHANGELOG entry**

Add under the top of `CHANGELOG.md`:

```markdown
## Unreleased

### Added

- **VS Code host mode**: when embedded in the Kanbeasy VS Code extension webview
  (`?host=vscode`), board and settings storage is backed by the extension host via
  `postMessage` instead of IndexedDB, and external (Copilot/MCP) board edits apply live.
  Standalone web behavior is unchanged.
```

- [ ] **Step 4: Commit**

```bash
git add CHANGELOG.md
git commit -m "docs: changelog for VS Code host mode"
```

---

## Self-Review Notes

- **Spec coverage:** host detection (Task 1), `db.ts` backend swap incl. `openDatabase`/`saveBoard`/`kvSet`/`kvRemove` (Task 2), `subscribeToExternalBoardChange` (Task 2), live inbound update via a single `BoardProvider` subscription (Task 4), non-recording apply so MCP edits stay out of undo (Task 3), standalone regression (Task 2 Step 8, Task 5 Step 1). Protocol message table from the spec is realized in Tasks 1–2 (`host:ready`, `host:init`, `host:saveBoard`, `host:kvSet`, `host:kvRemove`, `host:boardChanged`).
- **Deferred to the extension repo (not this plan):** the webview relay script, `protocolVersion`-mismatch read-only banner, and the extension-side `BoardStore`. The web app tolerates receiving only `host:init` (it simply won't get further messages), satisfying the spec's mismatch tolerance from this side.
- **Type consistency:** `InitPayload`/`BoardChangedPayload` defined in Task 1 are the exact shapes consumed in Tasks 2 and 4. `replaceState(next: T)` from Task 3 is used in Task 4.
