# Migrate to IndexedDB — Design Document

## Overview

Replace localStorage with IndexedDB as the primary persistence layer for all application data. This is a foundational change that removes the ~5 MB storage ceiling, enables future features (image attachments, multiple boards, activity logs), and consolidates data into a single storage backend — while preserving the local-first, private-data philosophy that defines the app.

## Why Now

localStorage has served the app well, but several planned features are blocked or constrained by it:

- **Image attachments** require IndexedDB regardless (blobs don't fit in localStorage). Running two storage backends in parallel creates complexity, inconsistency, and two code paths to test.
- **Multiple boards** multiply the data footprint. Ten boards with moderate card counts could approach the 5 MB ceiling.
- **Activity logs** (card movements, edits, deletions) generate unbounded data over time.
- **Undo/redo persistence** (survive page reload) would require storing 50 board snapshots — not viable in localStorage.

Migrating now, before these features are built, means they can be designed against one clean storage API rather than retrofitted.

## Principles

### Local-first, private data

This migration changes _where_ data is stored on the user's device, not _whether_ it stays on their device. IndexedDB is:

- **Local**: Data never leaves the browser. No network requests, no servers, no accounts.
- **Private**: Same-origin policy isolates data. No other site can read it.
- **Persistent**: Survives browser restarts, tab closes, and OS reboots (same as localStorage).
- **User-controlled**: Users can clear it via browser settings, DevTools, or the app's own "Clear data" actions.

Nothing about the app's privacy model changes.

### Storage eviction and durability

Browsers may evict IndexedDB data under storage pressure (low disk space). This is also true of localStorage in some browsers, but IndexedDB is more explicitly subject to the Storage API's eviction policies.

Mitigations:

- Request persistent storage via `navigator.storage.persist()` on first use. This asks the browser to exempt the origin from automatic eviction. Most browsers grant this for sites with engagement signals (bookmarks, frequent visits).
- Display a clear indicator in Settings if persistent storage was not granted.
- Continue recommending periodic exports as the primary backup mechanism. The export file is the canonical "safe copy" regardless of storage backend.

### No silent data loss

If IndexedDB is unavailable (rare — private browsing in some older browsers, disabled by policy), the app must not silently drop data. Options:

- Fall back to localStorage for the session, with a visible warning that data may not persist.
- Or disable persistence entirely and show a clear message: "Your browser does not support local storage. Data will be lost when you close this tab."

The app should never _appear_ to save data while silently discarding it.

## Current State: How localStorage Is Used

### Data categories

| Category       | Keys                                                      | Size profile                                           | Access pattern                                         |
| -------------- | --------------------------------------------------------- | ------------------------------------------------------ | ------------------------------------------------------ |
| Board state    | `kanbeasy:board`                                          | 1 KB – 1 MB+ (grows with cards, descriptions, archive) | Read once on startup, written on every mutation        |
| Card counter   | `kanbeasy:nextCardNumber`                                 | ~10 bytes                                              | Read on startup, written on card creation              |
| Theme/settings | 12 keys (`theme`, `themePreference`, `cardDensity`, etc.) | ~500 bytes total                                       | Read on startup, written on individual setting changes |
| UI state       | `kanbeasy:settingsSections`, `hasSeenWelcome`             | ~100 bytes                                             | Read on component mount, written on interaction        |

### Access patterns

**Synchronous initialization** is the core design assumption today. Both `BoardProvider` and `ThemeProvider` read localStorage in `useState` initializers and `useRef` lazy init — synchronous code that runs before the first render. This means the app never shows a loading state; it renders immediately with the correct data.

**Write-on-change** via `useEffect` hooks. Every state change triggers a useEffect that persists to localStorage. This is fire-and-forget (no error handling beyond dev-mode logging).

**50+ test files** seed localStorage directly with `localStorage.setItem()` in `beforeEach` blocks and assert with `localStorage.getItem()`.

## The Fundamental Tradeoff: Sync vs Async

localStorage is synchronous. IndexedDB is asynchronous. This is the single largest design decision in the migration.

### Option A: Async initialization with loading state

Replace synchronous reads with async IndexedDB reads. Show a loading indicator until data is ready.

```
App startup:
  1. Render loading spinner / skeleton
  2. Open IndexedDB, read board + settings
  3. Initialize providers with loaded data
  4. Render full app
```

**Pros**:

- Clean async API throughout
- No sync workarounds or caching layers
- Honest about the async nature of the storage

**Cons**:

- Visible loading state on every page load (even if IndexedDB resolves in <50ms)
- Flash of loading content on fast devices where it resolves instantly
- Every test needs async setup
- Providers can no longer initialize in `useState` — need a wrapper component or suspense boundary

### Option B: Sync cache with async IndexedDB backing (recommended)

Keep a synchronous in-memory cache that the app reads from. Persist to IndexedDB asynchronously in the background. On startup, read from IndexedDB once (async), populate the cache, then render.

```
App startup:
  1. Open IndexedDB, read all data (async)
  2. Populate sync cache
  3. Render app (providers read from cache synchronously)

Runtime:
  1. State change in provider
  2. Sync write to cache (immediate)
  3. Async write to IndexedDB (background, fire-and-forget)
```

**Pros**:

- Providers keep their synchronous initialization pattern
- Minimal refactor to existing components
- Single async boundary at app root (one loading state, one place to handle errors)
- Runtime writes are non-blocking
- Cache can be a simple `Map<string, unknown>` or plain object

**Cons**:

- Two representations of truth (cache + IndexedDB) — but cache is always authoritative at runtime, IndexedDB is the durable copy
- Risk of cache/IndexedDB divergence if async write fails — mitigated by retry and by the fact that the next write will include the full current state
- Slightly more code than pure async

**Verdict**: Option B. The loading state is confined to a single `<AppLoader>` wrapper. Everything downstream is synchronous, preserving the existing architecture. The async gap on startup is typically <50ms — imperceptible with a well-designed loading state (or none at all if we use a minimum threshold).

### Loading state design

Show the loading state only if IndexedDB takes longer than ~100ms to respond. For most users on modern hardware, the app will render instantly with no visible flash. If the user has a slow disk or large dataset, a minimal skeleton appears. This is implemented with a simple timeout race:

```typescript
function AppLoader({ children }) {
  const [ready, setReady] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowSkeleton(true), 100);
    initializeStorage().then(() => {
      clearTimeout(timer);
      setReady(true);
    });
  }, []);

  if (!ready) return showSkeleton ? <Skeleton /> : null;
  return children;
}
```

## IndexedDB Schema

### Database structure

```
Database: "kanbeasy" (version 1)

Object Stores:
  "kv"        — key-value store for settings and small data
                keyPath: "key"
                value: { key: string, value: unknown }

  "board"     — board state (single record, or one per board in multi-board future)
                keyPath: "id"
                value: { id: string, state: BoardState }
```

### Why a key-value store instead of one store per setting

Settings are small, numerous, and independently updated. A generic key-value store:

- Maps 1:1 to the current localStorage model (each key is a separate entry)
- Allows adding new settings without schema migrations (no `versionchange` events)
- Enables reading all settings in a single transaction (efficient startup)
- Keeps the IndexedDB schema version stable even as the app evolves

The `board` store is separate because board data is large and structured differently — it benefits from being its own object store for future indexing (e.g., by board ID in multi-board).

### Future: Attachments store

When image attachments are implemented, add a third store:

```
  "attachments" — binary image data
                  keyPath: "id"
                  value: { id: string, blob: Blob }
```

This can be added in a later `versionchange` (bump DB version to 2) without affecting the kv or board stores.

## Storage API Design

### Core module: `src/utils/db.ts`

```typescript
// Initialize the database. Called once at app startup.
export async function openDatabase(): Promise<void>;

// Key-value operations (settings, flags, counters)
export function kvGet<T>(key: string, fallback: T): T; // sync, from cache
export function kvSet<T>(key: string, value: T): void; // sync cache + async IDB
export function kvRemove(key: string): void; // sync cache + async IDB
export function kvGetAll(): Record<string, unknown>; // sync, from cache

// Board operations
export function getBoard(id?: string): BoardState; // sync, from cache
export function saveBoard(state: BoardState, id?: string): void; // sync cache + async IDB

// Bulk operations (for import)
export async function importAll(data: {
  kv: Record<string, unknown>;
  board: BoardState;
}): Promise<void>;

// Clear everything (for "Clear all data")
export async function clearAll(): Promise<void>;
```

**Key design decisions**:

- `kvGet` / `kvSet` / `getBoard` / `saveBoard` are **synchronous** — they operate on the in-memory cache. This means providers call them exactly like they call `getFromStorage` / `saveToStorage` today.
- The async IndexedDB write happens in the background after every `kvSet` / `saveBoard` call.
- `openDatabase()` is the only async function in the hot path — it's called once, before providers mount.
- `importAll` and `clearAll` are async because they involve bulk writes and cache invalidation.

### Write coalescing

Board state changes rapidly during drag-and-drop or bulk operations. Writing to IndexedDB on every mutation would be wasteful. Coalesce writes with a debounce:

- After `saveBoard()` updates the cache, schedule an IndexedDB write with a 100ms debounce.
- If another `saveBoard()` call arrives within 100ms, reset the timer.
- This means at most one IndexedDB write per 100ms during rapid mutations.
- On page unload (`beforeunload`), flush any pending write synchronously if possible (IndexedDB transactions can sometimes complete during unload, but this is not guaranteed — the cache is authoritative anyway).

Settings writes (`kvSet`) can use the same pattern or write immediately (they're small and infrequent).

### Error handling

- If IndexedDB is unavailable: set a module-level flag, log a warning, and fall back to in-memory-only mode. The app works for the session but data is lost on close.
- If a write fails (e.g., quota exceeded): log the error, keep the cache (data is still correct in memory), and surface a non-blocking toast: "Failed to save — your data may not persist."
- If a read fails during startup: fall back to empty state and show the welcome modal.

## Migration Path for Existing Users

### Automatic, one-time migration

On first load after the update:

1. `openDatabase()` opens IndexedDB.
2. Check if localStorage contains `kanbeasy:board` (the unmistakable signal of existing data).
3. If yes: read all localStorage keys, write them to IndexedDB (kv store + board store), populate the cache.
4. Set a migration marker in IndexedDB: `kv.set("_migrated_from_localstorage", true)`.
5. **Do not clear localStorage yet** — keep it as a safety net for one session.
6. On the _next_ app load, if the migration marker exists and IndexedDB data is valid, clear localStorage.

This two-phase approach ensures that if something goes wrong during the first IndexedDB load, the user's data is still in localStorage.

### Edge cases

**User has both localStorage and IndexedDB data** (shouldn't happen, but defensive):

- IndexedDB wins. If the migration marker exists, localStorage is stale.

**User downgrades** (reverts to an older version of the app that uses localStorage):

- The old version reads localStorage, which still has data from the safety-net period.
- If localStorage was already cleared (second load), the old version sees an empty board and shows the welcome modal. This is unfortunate but unavoidable — the user made a conscious choice to use an older version.
- Recommendation: document in release notes that this migration is one-way.

**User clears browser data between the two phases**:

- Both localStorage and IndexedDB are cleared. User starts fresh. No data loss beyond what the user intended.

**Private browsing / incognito mode**:

- IndexedDB is typically available but ephemeral (cleared on session end). The app works normally within the session.
- Some older browsers (Safari <15) block IndexedDB in private mode. The fallback (in-memory only) handles this.

**Storage quota exceeded during migration**:

- Unlikely — if the data fit in localStorage, it fits in IndexedDB (which has a much higher quota). But handle gracefully: log error, keep localStorage data, retry on next load.

## Refactoring Plan

### Phase 1: Storage abstraction layer

Create the new `db.ts` module with the sync cache + async IndexedDB pattern. Write comprehensive tests. **Do not integrate yet** — the module exists alongside the current `storage.ts`.

Key deliverables:

- `src/utils/db.ts` — core module
- `src/utils/__tests__/db.test.ts` — unit tests (mock IndexedDB with `fake-indexeddb` or manual mocks)
- Verify: cache consistency, write coalescing, error fallbacks, migration logic

### Phase 2: AppLoader wrapper

Add an `<AppLoader>` component that calls `openDatabase()` before rendering providers.

```tsx
// main.tsx (before)
<ThemeProvider>
  <BoardProvider>
    <App />
  </BoardProvider>
</ThemeProvider>

// main.tsx (after)
<AppLoader>
  <ThemeProvider>
    <BoardProvider>
      <App />
    </BoardProvider>
  </ThemeProvider>
</AppLoader>
```

This is the only structural change to the component tree. Everything inside `<AppLoader>` is guaranteed to have a populated cache.

### Phase 3: Swap storage calls in providers

Replace `getFromStorage` / `saveToStorage` / `getStringFromStorage` / `saveStringToStorage` / `removeFromStorage` calls with `kvGet` / `kvSet` / `kvRemove` calls. Replace board reads/writes with `getBoard` / `saveBoard`.

This is a mechanical, file-by-file replacement:

| File                  | Current                              | New                                              |
| --------------------- | ------------------------------------ | ------------------------------------------------ |
| `BoardProvider.tsx`   | `getFromStorage(BOARD)`              | `getBoard()`                                     |
| `BoardProvider.tsx`   | `saveToStorage(BOARD, state)`        | `saveBoard(state)`                               |
| `BoardProvider.tsx`   | `getFromStorage(NEXT_CARD_NUMBER)`   | `kvGet(NEXT_CARD_NUMBER, 0)`                     |
| `BoardProvider.tsx`   | `saveToStorage(NEXT_CARD_NUMBER, n)` | `kvSet(NEXT_CARD_NUMBER, n)`                     |
| `ThemeProvider.tsx`   | 12× `getStringFromStorage(KEY)`      | 12× `kvGet(KEY, fallback)`                       |
| `ThemeProvider.tsx`   | 12× `saveStringToStorage(KEY, val)`  | 12× `kvSet(KEY, val)`                            |
| `ThemeProvider.tsx`   | 14× `localStorage.removeItem(KEY)`   | 14× `kvRemove(KEY)`                              |
| `WelcomeModal.tsx`    | `localStorage.getItem(KEY)`          | `kvGet(KEY, null)`                               |
| `WelcomeModal.tsx`    | `localStorage.setItem(KEY, val)`     | `kvSet(KEY, val)`                                |
| `SettingsSection.tsx` | `localStorage.getItem(KEY)`          | `kvGet(KEY, {})`                                 |
| `SettingsSection.tsx` | `localStorage.setItem(KEY, val)`     | `kvSet(KEY, val)`                                |
| `migration.ts`        | `window.localStorage.getItem(...)`   | `kvGet(...)` (or remove if migration handles it) |
| `exportBoard.ts`      | `window.localStorage.getItem(KEY)`   | `kvGet(KEY, "")`                                 |

The `loadState()` function in BoardProvider no longer needs to read from localStorage and validate — it calls `getBoard()` which returns already-migrated, cached data. Validation and migration happen once, during the initial `openDatabase()` call.

### Phase 4: Update export/import

- **Export**: Read board from cache (`getBoard()`) and settings from cache (`kvGetAll()`). No async needed.
- **Import**: Call `importAll()` which writes to both cache and IndexedDB. Then trigger provider state updates via context setters (same as today).
- Bump export version to 10 (or whatever is current at implementation time).
- Import continues to support all prior versions (1–9) — the migration logic moves into the import path.

### Phase 5: Update tests

**This is the largest phase by line count.**

Current tests seed data with `localStorage.setItem()` and assert with `localStorage.getItem()`. Two strategies:

**Strategy A: Mock the db module**

- Create a test helper that pre-populates the `db.ts` cache.
- Tests call `seedBoard(state)` and `seedSetting(key, value)` instead of `localStorage.setItem()`.
- Assertions check the cache via `getBoard()` / `kvGet()`.

**Strategy B: Keep localStorage in tests via a compatibility shim**

- In the test environment, `db.ts` detects `import.meta.env.TEST` and falls back to localStorage (synchronous, no IndexedDB needed).
- Tests continue using `localStorage.setItem()` as today.
- This minimizes test changes but couples tests to an implementation detail.

**Recommended: Strategy A.** It's more work upfront but produces tests that are honest about the storage layer. A shared `seedBoard()` helper keeps test code clean. The `beforeEach(() => localStorage.clear())` in setup.ts becomes `beforeEach(() => resetDb())`.

### Phase 6: Remove old storage utilities

Once all consumers are migrated:

- Delete `src/utils/storage.ts` (the localStorage wrapper).
- Remove all direct `localStorage` calls.
- Remove `localStorage.clear()` from test setup (replace with `resetDb()`).
- Run `npm run knip` to confirm no dead code.

### Phase 7: Cleanup and polish

- Request persistent storage (`navigator.storage.persist()`) during `openDatabase()`.
- Add storage usage display in Settings > Data (via `navigator.storage.estimate()`).
- Add a toast/warning if persistent storage was denied.
- Remove the localStorage safety net (clear remaining localStorage data after confirming IndexedDB is healthy).

## Scenarios: When This Solution Works and When It Doesn't

### Works well

| Scenario                                                    | Why                                                                    |
| ----------------------------------------------------------- | ---------------------------------------------------------------------- |
| **Typical desktop browser** (Chrome, Firefox, Safari, Edge) | IndexedDB well-supported, generous quota, persistent storage available |
| **Repeat visitors**                                         | Data persists across sessions exactly like localStorage                |
| **Large boards** (hundreds of cards, long descriptions)     | No 5 MB ceiling; IndexedDB scales to hundreds of MB                    |
| **Image attachments** (future)                              | Blobs stored natively in IndexedDB; no base64 inflation                |
| **Multiple boards** (future)                                | Each board is a separate record in the `board` store                   |
| **Offline use**                                             | IndexedDB works offline; no network dependency                         |
| **Mobile browsers** (Chrome Android, Safari iOS)            | IndexedDB supported; quota typically 50% of free disk                  |

### Works with caveats

| Scenario                                                 | Caveat                                       | Mitigation                                                       |
| -------------------------------------------------------- | -------------------------------------------- | ---------------------------------------------------------------- |
| **Private/incognito browsing**                           | Data cleared on session end                  | App works during session; warn that data won't persist           |
| **Safari <15 private mode**                              | IndexedDB blocked entirely                   | Fall back to in-memory; show warning                             |
| **Very old browsers** (IE11, early Edge)                 | No IndexedDB or buggy                        | App already requires ES2020+; these browsers can't run it anyway |
| **Browser storage pressure**                             | Eviction possible without persistent storage | Request `persist()`, recommend exports                           |
| **Large exports with images**                            | Export file can be huge                      | "Export without images" option, progress indicator               |
| **Firefox about:config `dom.indexedDB.enabled = false`** | User explicitly disabled IDB                 | Fall back to in-memory; show warning                             |

### Doesn't work / bad fit

| Scenario                                | Problem                                       | Alternative                                                                               |
| --------------------------------------- | --------------------------------------------- | ----------------------------------------------------------------------------------------- |
| **Server-side rendering**               | No IndexedDB on server                        | Not applicable — this is a client-only SPA                                                |
| **Shared/kiosk computers**              | Any user can read IndexedDB via DevTools      | Same problem with localStorage; not a regression                                          |
| **Cross-device sync**                   | IndexedDB is per-origin, per-device           | Export/import is the sync mechanism; a future sync feature would need a different backend |
| **Programmatic access from other apps** | IndexedDB is same-origin locked               | Same as localStorage; export file is the interchange format                               |
| **Guaranteed durability**               | Browser can still lose data (crash, eviction) | Export is the backup; IndexedDB is best-effort local persistence                          |

### When to reconsider this decision

- **If the app moves to a server-backed model**: IndexedDB becomes a cache layer, not the source of truth. The migration still has value (offline support), but the architecture changes fundamentally.
- **If a lightweight sync solution emerges** (e.g., CRDTs with a relay server): IndexedDB is the natural local store for CRDT state. The migration enables this.
- **If browser vendors deprecate or restrict IndexedDB**: Extremely unlikely given its role as the standard client-side database, but worth monitoring.

## What We Gain

- **No storage ceiling**: IndexedDB quota is typically 50%+ of available disk space.
- **Single storage backend**: One API to learn, test, and maintain. No split-brain between localStorage and IndexedDB.
- **Enables blocked features**: Image attachments, multiple boards, activity logs, undo persistence.
- **Better performance for large boards**: IndexedDB handles structured data more efficiently than JSON-stringifying entire board state into a single localStorage string.
- **Write coalescing**: Debounced writes reduce I/O during rapid mutations (drag-and-drop, bulk edits).

## What We Lose

- **Synchronous startup**: The app needs a brief async init phase. Mitigated by the cache pattern and 100ms skeleton threshold.
- **DevTools simplicity**: localStorage is a flat key-value list visible in the Application tab. IndexedDB requires expanding tree nodes. Minor ergonomic loss for developers.
- **Test simplicity**: Tests can no longer seed data with one-line `localStorage.setItem()` calls. Mitigated by a `seedBoard()` helper.
- **Export readability**: If we move all settings into IndexedDB, the export format changes. But the export was already a structured JSON file — the format is equally readable.

## What Does Not Change

- **Data stays on the user's device.** No servers, no accounts, no network.
- **Data is private.** Same-origin policy applies equally to IndexedDB.
- **Export/import is the backup and sharing mechanism.** The file format evolves but the workflow is identical.
- **The app works offline.** It already does; IndexedDB doesn't change this.
- **User controls their data.** Clear via app settings or browser tools.

## Dependencies

No new runtime dependencies. IndexedDB is a native browser API.

For testing, consider `fake-indexeddb` (~15 KB, 0 deps) to provide an in-memory IndexedDB implementation in the jsdom test environment. Vitest's jsdom does not include IndexedDB by default.

| Package          | Size (gzip) | Deps | Purpose                                         |
| ---------------- | ----------- | ---- | ----------------------------------------------- |
| `fake-indexeddb` | ~15 KB      | 0    | Test-only; in-memory IndexedDB for Vitest/jsdom |

This is a dev dependency only — it does not affect the production bundle.

## Risk Assessment

| Risk                                    | Likelihood | Impact                | Mitigation                                                                 |
| --------------------------------------- | ---------- | --------------------- | -------------------------------------------------------------------------- |
| IndexedDB unavailable in target browser | Very low   | High (no persistence) | Feature detection + in-memory fallback + warning                           |
| Data loss during migration              | Low        | Critical              | Two-phase migration; localStorage kept as safety net                       |
| Async init causes visible flash         | Medium     | Low (cosmetic)        | 100ms threshold before showing skeleton                                    |
| Write coalescing loses data on crash    | Low        | Medium                | Debounce is short (100ms); `beforeunload` flush; export is the real backup |
| `fake-indexeddb` becomes unmaintained   | Low        | Low (dev-only)        | Can be replaced with manual mocks; only used in tests                      |
| Large refactor introduces bugs          | Medium     | Medium                | Phased rollout; each phase is independently testable and deployable        |

## Timeline Estimate

| Phase                  | Scope                                      | Relative size |
| ---------------------- | ------------------------------------------ | ------------- |
| 1. Storage abstraction | New module + tests                         | Medium        |
| 2. AppLoader           | Small component + main.tsx change          | Small         |
| 3. Swap storage calls  | Mechanical replacements across ~8 files    | Medium        |
| 4. Export/import       | Version bump + migration path              | Small         |
| 5. Update tests        | 50+ test files, new helpers                | Large         |
| 6. Remove old utils    | Delete + knip verification                 | Small         |
| 7. Polish              | Persistent storage, usage display, cleanup | Small         |

Phase 5 (tests) is the most labor-intensive but lowest-risk phase — it's purely mechanical and can be done incrementally.
