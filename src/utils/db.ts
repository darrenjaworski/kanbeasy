import type { BoardState } from "../board/types";
import { STORAGE_KEYS } from "../constants/storage";

const DB_NAME = "kanbeasy";
const DB_VERSION = 1;
const KV_STORE = "kv";
const BOARD_STORE = "board";
const DEFAULT_BOARD_ID = "default";

const WRITE_DEBOUNCE_MS = 100;

// In-memory cache — authoritative at runtime
const kvCache = new Map<string, unknown>();
let boardCache: Record<string, BoardState> = {};
let db: IDBDatabase | null = null;
let available = true;

// Debounced write state
let boardWriteTimer: ReturnType<typeof setTimeout> | null = null;
let pendingBoardId: string | null = null;

function idbPut(storeName: string, value: unknown): void {
  if (!db) return;
  try {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).put(value);
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn(`[db] Failed to write to "${storeName}":`, e);
    }
  }
}

function idbDelete(storeName: string, key: string): void {
  if (!db) return;
  try {
    const tx = db.transaction(storeName, "readwrite");
    tx.objectStore(storeName).delete(key);
  } catch (e) {
    if (import.meta.env.DEV) {
      console.warn(`[db] Failed to delete from "${storeName}":`, e);
    }
  }
}

function flushBoardWrite(): void {
  if (pendingBoardId === null) return;
  const id = pendingBoardId;
  pendingBoardId = null;
  boardWriteTimer = null;
  const state = boardCache[id];
  if (state) {
    idbPut(BOARD_STORE, { id, state });
  }
}

function scheduleBoardWrite(id: string): void {
  pendingBoardId = id;
  if (boardWriteTimer !== null) {
    clearTimeout(boardWriteTimer);
  }
  boardWriteTimer = setTimeout(flushBoardWrite, WRITE_DEBOUNCE_MS);
}

// --- localStorage migration helpers ---

function migrateFromLocalStorage(): {
  kv: Map<string, unknown>;
  board: BoardState | null;
} {
  const kv = new Map<string, unknown>();
  let board: BoardState | null = null;

  const boardRaw = window.localStorage.getItem(STORAGE_KEYS.BOARD);
  if (boardRaw !== null) {
    try {
      board = JSON.parse(boardRaw) as BoardState;
    } catch {
      // corrupt data, skip
    }
  }

  // Migrate all kv settings
  const kvKeys = Object.values(STORAGE_KEYS).filter(
    (k) => k !== STORAGE_KEYS.BOARD,
  );
  for (const key of kvKeys) {
    const raw = window.localStorage.getItem(key);
    if (raw !== null) {
      // Try to parse as JSON; fall back to raw string
      try {
        kv.set(key, JSON.parse(raw));
      } catch {
        kv.set(key, raw);
      }
    }
  }

  return { kv, board };
}

async function writeMigrationToIdb(
  database: IDBDatabase,
  kvData: Map<string, unknown>,
  board: BoardState | null,
): Promise<void> {
  return new Promise((resolve, reject) => {
    const storeNames = [KV_STORE];
    if (board) storeNames.push(BOARD_STORE);

    const tx = database.transaction(storeNames, "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"));

    const kvStore = tx.objectStore(KV_STORE);
    for (const [key, value] of kvData) {
      kvStore.put({ key, value });
    }

    if (board) {
      tx.objectStore(BOARD_STORE).put({ id: DEFAULT_BOARD_ID, state: board });
    }

    // Mark migration complete
    kvStore.put({ key: "_migrated_from_localstorage", value: true });
  });
}

// --- Internal helpers ---

function applyMigrationToCache(
  kv: Map<string, unknown>,
  board: BoardState | null,
): void {
  for (const [key, value] of kv) {
    kvCache.set(key, value);
  }
  if (board) {
    boardCache[DEFAULT_BOARD_ID] = board;
  }
}

// --- Public API ---

export async function openDatabase(): Promise<void> {
  if (typeof indexedDB === "undefined") {
    available = false;
    if (import.meta.env.DEV) {
      console.warn("[db] IndexedDB is not available. Using in-memory only.");
    }
    const { kv, board } = migrateFromLocalStorage();
    applyMigrationToCache(kv, board);
    return;
  }

  try {
    db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains(KV_STORE)) {
          database.createObjectStore(KV_STORE, { keyPath: "key" });
        }
        if (!database.objectStoreNames.contains(BOARD_STORE)) {
          database.createObjectStore(BOARD_STORE, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () =>
        reject(request.error ?? new Error("IndexedDB request failed"));
    });

    // Populate caches from IndexedDB
    await populateCaches(db);

    // Check if we need to migrate from localStorage
    const migrated = kvCache.get("_migrated_from_localstorage");
    if (!migrated && typeof window !== "undefined" && window.localStorage) {
      const boardRaw = window.localStorage.getItem(STORAGE_KEYS.BOARD);
      if (boardRaw !== null) {
        const { kv, board } = migrateFromLocalStorage();
        await writeMigrationToIdb(db, kv, board);
        applyMigrationToCache(kv, board);
        kvCache.set("_migrated_from_localstorage", true);
      }
    }

    // If migration was done on a previous load, clear localStorage
    if (migrated && typeof window !== "undefined" && window.localStorage) {
      const boardRaw = window.localStorage.getItem(STORAGE_KEYS.BOARD);
      if (boardRaw !== null) {
        for (const key of Object.values(STORAGE_KEYS)) {
          window.localStorage.removeItem(key);
        }
      }
    }

    // Request persistent storage
    if (navigator.storage?.persist) {
      navigator.storage.persist().catch(() => {
        // Non-critical — best effort
      });
    }
  } catch (e) {
    available = false;
    if (import.meta.env.DEV) {
      console.warn("[db] Failed to open IndexedDB. Using in-memory only:", e);
    }
    const { kv, board } = migrateFromLocalStorage();
    applyMigrationToCache(kv, board);
  }
}

async function populateCaches(database: IDBDatabase): Promise<void> {
  return new Promise((resolve, reject) => {
    const tx = database.transaction([KV_STORE, BOARD_STORE], "readonly");
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"));

    let kvDone = false;
    let boardDone = false;
    const checkDone = () => {
      if (kvDone && boardDone) resolve();
    };

    const kvReq = tx.objectStore(KV_STORE).getAll();
    kvReq.onsuccess = () => {
      const entries = kvReq.result as { key: string; value: unknown }[];
      for (const entry of entries) {
        kvCache.set(entry.key, entry.value);
      }
      kvDone = true;
      checkDone();
    };

    const boardReq = tx.objectStore(BOARD_STORE).getAll();
    boardReq.onsuccess = () => {
      const entries = boardReq.result as { id: string; state: BoardState }[];
      for (const entry of entries) {
        boardCache[entry.id] = entry.state;
      }
      boardDone = true;
      checkDone();
    };
  });
}

// --- Key-value operations (sync reads, async writes) ---

export function kvGet<T>(key: string, fallback: T): T {
  if (!kvCache.has(key)) return fallback;
  return kvCache.get(key) as T;
}

export function kvGetBool(key: string, fallback: boolean): boolean {
  return kvGet<string>(key, String(fallback)) === "true";
}

export function kvSet<T>(key: string, value: T): void {
  kvCache.set(key, value);
  if (available) {
    idbPut(KV_STORE, { key, value });
  }
}

export function kvSetBool(key: string, value: boolean): void {
  kvSet(key, String(value));
}

export function kvRemove(key: string): void {
  kvCache.delete(key);
  if (available) {
    idbDelete(KV_STORE, key);
  }
}

export function kvGetAll(): Record<string, unknown> {
  const result: Record<string, unknown> = {};
  for (const [key, value] of kvCache) {
    result[key] = value;
  }
  return result;
}

// --- Board operations (sync reads, debounced async writes) ---

export function getBoard(id: string = DEFAULT_BOARD_ID): BoardState | null {
  return boardCache[id] ?? null;
}

export function saveBoard(
  state: BoardState,
  id: string = DEFAULT_BOARD_ID,
): void {
  boardCache[id] = state;
  if (available) {
    scheduleBoardWrite(id);
  }
}

// --- Bulk operations ---

export async function importAll(data: {
  kv: Record<string, unknown>;
  board: BoardState;
}): Promise<void> {
  // Update caches
  kvCache.clear();
  for (const [key, value] of Object.entries(data.kv)) {
    kvCache.set(key, value);
  }
  boardCache[DEFAULT_BOARD_ID] = data.board;

  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db!.transaction([KV_STORE, BOARD_STORE], "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"));

    // Clear and repopulate kv store
    const kvStore = tx.objectStore(KV_STORE);
    kvStore.clear();
    for (const [key, value] of Object.entries(data.kv)) {
      kvStore.put({ key, value });
    }

    // Clear and repopulate board store
    const boardStore = tx.objectStore(BOARD_STORE);
    boardStore.clear();
    boardStore.put({ id: DEFAULT_BOARD_ID, state: data.board });
  });
}

export async function clearAll(): Promise<void> {
  kvCache.clear();
  boardCache = {};

  if (!db) return;

  return new Promise((resolve, reject) => {
    const tx = db!.transaction([KV_STORE, BOARD_STORE], "readwrite");
    tx.oncomplete = () => resolve();
    tx.onerror = () =>
      reject(tx.error ?? new Error("IndexedDB transaction failed"));
    tx.objectStore(KV_STORE).clear();
    tx.objectStore(BOARD_STORE).clear();
  });
}

// --- Test helpers ---

export function resetDb(): void {
  kvCache.clear();
  boardCache = {};
  if (db) {
    db.close();
    db = null;
  }
  available = true;
  if (boardWriteTimer !== null) {
    clearTimeout(boardWriteTimer);
    boardWriteTimer = null;
  }
  pendingBoardId = null;
}

export function isAvailable(): boolean {
  return available;
}

// Flush pending writes (for beforeunload or tests)
export function flushPendingWrites(): void {
  flushBoardWrite();
}

// Seed data for tests (bypasses IDB, writes to cache only)
export function seedKv(key: string, value: unknown): void {
  kvCache.set(key, value);
}

export function seedBoard(
  state: BoardState,
  id: string = DEFAULT_BOARD_ID,
): void {
  boardCache[id] = state;
}
