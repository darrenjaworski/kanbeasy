# VS Code Host-Mode Integration — Design

**Date:** 2026-06-18
**Driver:** [vscode-kanbeasy #2 — MCP for Copilot integration](https://github.com/darrenjaworski/vscode-kanbeasy/issues/2)
**Status:** Approved design, pre-implementation
**Companion spec:** `vscode-kanbeasy/docs/superpowers/specs/2026-06-18-mcp-copilot-integration-design.md`

## Summary

Add a **host mode** to the Kanbeasy web app so that, when it runs inside the Kanbeasy VS Code
extension's webview, its storage is backed by the **extension host** (via `postMessage`)
instead of the app's own IndexedDB. This lets the extension be the single source of truth so
an MCP server can let Copilot read/edit the board whether or not the board panel is open.

When _not_ in host mode (i.e. normal use on `https://darrenjaworski.github.io/kanbeasy/`),
behavior is **completely unchanged** — IndexedDB remains the backend.

## Why this is a small change

The storage layer is already cleanly abstracted in `src/utils/db.ts`:

- Sync reads off an authoritative in-memory cache: `getBoard()`, `kvGet()`.
- Async/debounced write-through: `saveBoard()`, `kvSet()`, `kvRemove()`.
- A single async init: `openDatabase()`, already `await`ed by `AppLoader` before render.

So host mode is implemented almost entirely inside `db.ts` by swapping the **backend** behind
this existing API. `BoardProvider`, mutations, and all UI/React code call the same functions
and are **unchanged** — with one exception (live inbound updates, below).

## Goals

- In host mode, `getBoard`/`saveBoard`/`kvGet`/`kvSet`/`kvRemove` are backed by the extension.
- `openDatabase()` in host mode hydrates the cache from the extension before first render.
- External edits (from Copilot via MCP) made while the board is open re-render the UI live.
- Standalone (non-host) behavior is byte-for-byte unchanged.

## Non-goals

- No UI redesign, no new views, no settings changes.
- Host mode does not need to support IndexedDB _and_ the host backend simultaneously; in host
  mode the host backend is authoritative and IndexedDB is bypassed.

## Host-mode detection

Detect once at startup:

- Primary signal: URL query flag `?host=vscode` (the extension sets the iframe `src` to it).
- The extension's webview relay also sends an initial `host:init` handshake message; host mode
  is confirmed when that handshake completes.

Expose `isHostMode(): boolean` from `db.ts` (or a small `src/utils/hostBridge.ts`).

## Changes to `src/utils/db.ts`

Introduce a backend seam. The public API (`getBoard`, `saveBoard`, `kvGet`, `kvSet`,
`kvRemove`, `kvGetAll`, `openDatabase`, `flushPendingWrites`) is preserved. Internally:

- **IndexedDB backend** — the current implementation, used when `!isHostMode()`.
- **Host backend** — used when `isHostMode()`:
  - `openDatabase()` → send `host:ready` to the extension and `await` the `host:init` reply
    carrying `{ board: BoardState, nextCardNumber: number, kv: Record<string, unknown> }`.
    Seed `boardCache[DEFAULT_BOARD_ID]` and `kvCache` from it (same caches as today, so sync
    reads keep working). No IndexedDB open, no localStorage migration.
  - `getBoard()` / `kvGet()` → unchanged (read the seeded cache).
  - `saveBoard(state)` → update cache + post `host:saveBoard { state }` to the extension
    (replaces the IndexedDB write; keep the existing debounce).
  - `kvSet(key, value)` / `kvRemove(key)` → update cache + post `host:kvSet` / `host:kvRemove`.
  - `flushPendingWrites()` → flush any pending debounced `host:saveBoard`.

## Live inbound updates (the one React-layer change)

When Copilot edits the board via MCP while the panel is open, the extension pushes new state
to the webview. Updating the cache alone will not re-render React, so:

1. `db.ts` (host backend) listens for `host:boardChanged { state, nextCardNumber }` from the
   extension, updates `boardCache`, and notifies subscribers.
2. Add `subscribeToExternalBoardChange(cb: (state: BoardState, nextCardNumber: number) => void): () => void`
   to `db.ts`. No-op (returns a no-op unsubscribe) when not in host mode.
3. `BoardProvider` subscribes on mount and, on callback, calls `setState(newState)` and updates
   `nextCardNumberRef`. This is the **only** change to `BoardProvider.tsx` — an effect that
   wires the subscription. Guard against feedback: a state set originating from an inbound push
   must not be re-posted back as a `host:saveBoard` (tag/skip, mirroring the existing
   `initialStateRef` skip in the effect at `BoardProvider.tsx:196`).

## Bridge message protocol

All messages carry `{ source: "kanbeasy", protocolVersion: <n>, type, payload }`. Direction is
relative to the web app.

| Type                | Direction | Payload                                                                                  |
| ------------------- | --------- | ---------------------------------------------------------------------------------------- |
| `host:ready`        | app → ext | `{}` (handshake; app is mounted and awaiting state)                                      |
| `host:init`         | ext → app | `{ board, kv }` (next-card-number travels in `kv` under `STORAGE_KEYS.NEXT_CARD_NUMBER`) |
| `host:saveBoard`    | app → ext | `{ state }`                                                                              |
| `host:kvSet`        | app → ext | `{ key, value }`                                                                         |
| `host:kvRemove`     | app → ext | `{ key }`                                                                                |
| `host:boardChanged` | ext → app | `{ state, nextCardNumber }` (external/MCP edit)                                          |

- `protocolVersion` mismatch: the extension surfaces a banner and treats the session as
  read-only rather than risk corrupting data. The web app should tolerate receiving only
  `host:init` and no further messages.
- Transport note: the extension host cannot `postMessage` the cross-origin iframe directly. The
  extension's **webview HTML** runs a relay that bridges `acquireVsCodeApi()` ↔
  `iframe.contentWindow.postMessage`. The web app only ever talks to `window.parent`.

## Shared types

`BoardState`, `Card`, `Column`, `ArchivedCard`, `ColumnHistoryEntry` in `src/board/types.ts`
are the canonical contract. The extension keeps a synced copy. Any change to these types is a
breaking change to the bridge and must bump `protocolVersion` and ship both repos together.

## Files touched (web app)

- `src/utils/db.ts` — backend seam + host backend + `subscribeToExternalBoardChange`.
- `src/utils/hostBridge.ts` _(new)_ — host detection, `postMessage` send/receive, protocol
  constants. (Or inline in `db.ts` if preferred.)
- `src/board/BoardProvider.tsx` — subscribe to external board changes (one effect).
- `src/constants/behavior.ts` — possibly a host write-debounce constant (reuse existing).

No changes to columns, cards, search, theme, or any visual component.

## Testing

- Unit (`db.ts`): host backend hydrate-from-`host:init`, write-through posts correct messages,
  debounce flush, `subscribeToExternalBoardChange` fires on `host:boardChanged`.
- Component (`BoardProvider`): inbound `host:boardChanged` re-renders board; inbound-originated
  state does not echo back a `host:saveBoard`.
- Regression: with no `?host=vscode` and no handshake, all existing IndexedDB tests pass
  unchanged.

## Relationship to multi-board

`getBoard`/`saveBoard` already take a board `id` (default `"default"`), and there is a
`multi-board-design.md` in this repo. Host mode targets only the default board for now, but the
bridge protocol leaves room to add a `boardId` to messages later without breaking the contract
(it would bump `protocolVersion`).
