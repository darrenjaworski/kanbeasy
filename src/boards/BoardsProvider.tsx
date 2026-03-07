import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { BoardsContext } from "./BoardsContext";
import type { BoardIndex, BoardMeta } from "./types";
import { STORAGE_KEYS, boardStorageKey } from "../constants/storage";
import { getFromStorage, saveToStorage } from "../utils/storage";

const DEFAULT_BOARD_ID = "default";

function createDefaultIndex(): BoardIndex {
  const now = new Date().toISOString();
  return {
    boards: [
      {
        id: DEFAULT_BOARD_ID,
        title: "My Board",
        createdAt: now,
        updatedAt: now,
      },
    ],
    activeBoardId: DEFAULT_BOARD_ID,
    nextCardNumber: 0,
  };
}

function migrateFromSingleBoard(): BoardIndex | null {
  if (typeof window === "undefined") return null;

  const existingBoard = window.localStorage.getItem(STORAGE_KEYS.BOARD);
  if (existingBoard === null) return null;

  // Move existing board data to the new keyed format
  window.localStorage.setItem(boardStorageKey(DEFAULT_BOARD_ID), existingBoard);
  window.localStorage.removeItem(STORAGE_KEYS.BOARD);

  // Read existing card counter
  const counterRaw = window.localStorage.getItem(STORAGE_KEYS.NEXT_CARD_NUMBER);
  const counter = counterRaw ? Number(counterRaw) : 0;
  window.localStorage.removeItem(STORAGE_KEYS.NEXT_CARD_NUMBER);

  const now = new Date().toISOString();
  const index: BoardIndex = {
    boards: [
      {
        id: DEFAULT_BOARD_ID,
        title: "My Board",
        createdAt: now,
        updatedAt: now,
      },
    ],
    activeBoardId: DEFAULT_BOARD_ID,
    nextCardNumber: counter,
  };

  saveToStorage(STORAGE_KEYS.BOARD_INDEX, index);
  return index;
}

function loadIndex(): BoardIndex {
  const stored = getFromStorage<BoardIndex | null>(
    STORAGE_KEYS.BOARD_INDEX,
    null,
  );
  if (stored && Array.isArray(stored.boards) && stored.boards.length > 0) {
    return stored;
  }

  // Try migrating from single-board format
  const migrated = migrateFromSingleBoard();
  if (migrated) return migrated;

  // Brand new user
  const fresh = createDefaultIndex();
  saveToStorage(STORAGE_KEYS.BOARD_INDEX, fresh);
  return fresh;
}

export function BoardsProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const indexRef = useRef<BoardIndex | null>(null);
  if (indexRef.current === null) {
    indexRef.current = loadIndex();
  }

  const [boards, setBoards] = useState<BoardMeta[]>(indexRef.current.boards);
  const [activeBoardId, setActiveBoardId] = useState<string>(
    indexRef.current.activeBoardId,
  );
  const nextCardNumberRef = useRef(indexRef.current.nextCardNumber);

  // Persist index whenever boards or activeBoardId change
  useEffect(() => {
    const index: BoardIndex = {
      boards,
      activeBoardId,
      nextCardNumber: nextCardNumberRef.current,
    };
    saveToStorage(STORAGE_KEYS.BOARD_INDEX, index);
  }, [boards, activeBoardId]);

  const setNextCardNumber = useCallback(
    (n: number) => {
      nextCardNumberRef.current = n;
      const index: BoardIndex = {
        boards,
        activeBoardId,
        nextCardNumber: n,
      };
      saveToStorage(STORAGE_KEYS.BOARD_INDEX, index);
    },
    [boards, activeBoardId],
  );

  const createBoard = useCallback((title: string): string => {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const meta: BoardMeta = {
      id,
      title,
      createdAt: now,
      updatedAt: now,
    };
    setBoards((prev) => [...prev, meta]);
    setActiveBoardId(id);
    return id;
  }, []);

  const deleteBoard = useCallback(
    (id: string) => {
      setBoards((prev) => {
        if (prev.length <= 1) return prev;
        const next = prev.filter((b) => b.id !== id);
        if (next.length === prev.length) return prev;

        // Clean up board data from localStorage
        window.localStorage.removeItem(boardStorageKey(id));

        // If deleting the active board, switch to the first remaining
        if (id === activeBoardId) {
          setActiveBoardId(next[0].id);
        }
        return next;
      });
    },
    [activeBoardId],
  );

  const renameBoard = useCallback((id: string, title: string) => {
    setBoards((prev) =>
      prev.map((b) =>
        b.id === id ? { ...b, title, updatedAt: new Date().toISOString() } : b,
      ),
    );
  }, []);

  const switchBoard = useCallback((id: string) => {
    setActiveBoardId(id);
  }, []);

  const duplicateBoard = useCallback((id: string, title: string): string => {
    const newId = crypto.randomUUID();
    const now = new Date().toISOString();
    const meta: BoardMeta = {
      id: newId,
      title,
      createdAt: now,
      updatedAt: now,
    };

    // Copy board data
    const sourceData = window.localStorage.getItem(boardStorageKey(id));
    if (sourceData) {
      window.localStorage.setItem(boardStorageKey(newId), sourceData);
    }

    setBoards((prev) => {
      const sourceIndex = prev.findIndex((b) => b.id === id);
      const next = [...prev];
      next.splice(sourceIndex + 1, 0, meta);
      return next;
    });
    setActiveBoardId(newId);
    return newId;
  }, []);

  const value = useMemo(
    () => ({
      boards,
      activeBoardId,
      nextCardNumber: nextCardNumberRef.current,
      createBoard,
      deleteBoard,
      renameBoard,
      switchBoard,
      duplicateBoard,
      setNextCardNumber,
    }),
    [
      boards,
      activeBoardId,
      createBoard,
      deleteBoard,
      renameBoard,
      switchBoard,
      duplicateBoard,
      setNextCardNumber,
    ],
  );

  return (
    <BoardsContext.Provider value={value}>{children}</BoardsContext.Provider>
  );
}
