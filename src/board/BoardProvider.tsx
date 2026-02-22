import { useEffect, useMemo } from "react";
import { BoardContext } from "./BoardContext";
import type { BoardContextValue, BoardState } from "./types";
import { getFromStorage, saveToStorage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storage";
import { isColumn } from "./validation";
import { migrateColumns } from "./migration";
import { useUndoableState } from "./useUndoableState";
import { useBoardMutations } from "./useBoardMutations";
import { useCardSearch } from "./useCardSearch";

function createInitialBoard(): BoardState {
  const now = Date.now();
  const todoId = crypto.randomUUID();
  const inProgressId = crypto.randomUUID();
  const doneId = crypto.randomUUID();

  return {
    columns: [
      {
        id: todoId,
        title: "To Do",
        createdAt: now,
        updatedAt: now,
        cards: [
          {
            id: crypto.randomUUID(),
            title: "My first task",
            createdAt: now,
            updatedAt: now,
            columnHistory: [{ columnId: todoId, enteredAt: now }],
          },
          {
            id: crypto.randomUUID(),
            title: "Another task",
            createdAt: now,
            updatedAt: now,
            columnHistory: [{ columnId: todoId, enteredAt: now }],
          },
        ],
      },
      {
        id: inProgressId,
        title: "In Progress",
        createdAt: now,
        updatedAt: now,
        cards: [
          {
            id: crypto.randomUUID(),
            title: "A task in progress",
            createdAt: now,
            updatedAt: now,
            columnHistory: [{ columnId: inProgressId, enteredAt: now }],
          },
        ],
      },
      {
        id: doneId,
        title: "Done",
        createdAt: now,
        updatedAt: now,
        cards: [
          {
            id: crypto.randomUUID(),
            title: "A completed task",
            createdAt: now,
            updatedAt: now,
            columnHistory: [{ columnId: doneId, enteredAt: now }],
          },
        ],
      },
    ],
  };
}


function loadState(): BoardState {
  // When no board data has ever been saved, seed with example columns.
  // After "Clear board data", the key exists with { columns: [] }, so we won't re-seed.
  const raw =
    typeof window !== "undefined"
      ? window.localStorage.getItem(STORAGE_KEYS.BOARD)
      : null;

  if (raw === null) {
    return createInitialBoard();
  }

  const stored = getFromStorage<{ columns?: unknown }>(STORAGE_KEYS.BOARD, {});

  const cols = Array.isArray(stored.columns)
    ? (stored.columns as unknown[])
        .map((c) => {
          // migrate legacy columns lacking cards
          if (
            c &&
            typeof c === "object" &&
            typeof (c as { id?: unknown }).id === "string" &&
            typeof (c as { title?: unknown }).title === "string" &&
            !Array.isArray((c as { cards?: unknown }).cards)
          ) {
            const obj = c as Record<string, unknown>;
            return { ...obj, cards: [] };
          }
          return c;
        })
        .filter(isColumn)
    : [];

  // Backfill timestamps on legacy data
  const migrated = migrateColumns(cols as unknown as Record<string, unknown>[]);

  return { columns: migrated };
}

function saveState(state: BoardState) {
  saveToStorage(STORAGE_KEYS.BOARD, state);
}

export function BoardProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const {
    state,
    setState,
    undo,
    redo,
    canUndo,
    canRedo,
  } = useUndoableState<BoardState>(() => loadState(), {
    maxHistory: 50,
  });

  useEffect(() => {
    saveState(state);
  }, [state]);

  const mutations = useBoardMutations(setState);
  const { searchQuery, setSearchQuery, matchingCardIds } = useCardSearch(
    state.columns,
  );

  const value = useMemo<BoardContextValue>(
    () => ({
      columns: state.columns,
      ...mutations,
      searchQuery,
      setSearchQuery,
      matchingCardIds,
      canUndo,
      canRedo,
      undo,
      redo,
    }),
    [
      state.columns,
      mutations,
      searchQuery,
      setSearchQuery,
      matchingCardIds,
      canUndo,
      canRedo,
      undo,
      redo,
    ],
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}
