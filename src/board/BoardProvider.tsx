import { useCallback, useEffect, useMemo, useRef } from "react";
import { BoardContext } from "./BoardContext";
import type { BoardContextValue, BoardState } from "./types";
import { getFromStorage, saveToStorage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storage";
import { isColumn } from "./validation";
import { migrateColumnsWithNumbering } from "./migration";
import { useUndoableState } from "./useUndoableState";
import { useBoardMutations } from "./useBoardMutations";
import { useCardSearch } from "./useCardSearch";

type LoadResult = { state: BoardState; nextCardNumber: number };

function createInitialBoard(): LoadResult {
  const now = Date.now();
  const todoId = crypto.randomUUID();
  const inProgressId = crypto.randomUUID();
  const doneId = crypto.randomUUID();

  return {
    state: {
      columns: [
        {
          id: todoId,
          title: "To Do",
          createdAt: now,
          updatedAt: now,
          cards: [
            {
              id: crypto.randomUUID(),
              number: 1,
              title: "My first task",
              description: "",
              ticketTypeId: null,
              createdAt: now,
              updatedAt: now,
              columnHistory: [{ columnId: todoId, enteredAt: now }],
            },
            {
              id: crypto.randomUUID(),
              number: 2,
              title: "Another task",
              description: "",
              ticketTypeId: null,
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
              number: 3,
              title: "A task in progress",
              description: "",
              ticketTypeId: null,
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
              number: 4,
              title: "A completed task",
              description: "",
              ticketTypeId: null,
              createdAt: now,
              updatedAt: now,
              columnHistory: [{ columnId: doneId, enteredAt: now }],
            },
          ],
        },
      ],
    },
    nextCardNumber: 5,
  };
}

function loadState(): LoadResult {
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

  // Migrate timestamps and assign card numbers
  const { columns, nextCardNumber } = migrateColumnsWithNumbering(
    cols as unknown as Record<string, unknown>[],
  );

  // Reconcile with persisted counter (take the max)
  const persistedCounter = getFromStorage<number>(
    STORAGE_KEYS.NEXT_CARD_NUMBER,
    0,
  );

  return {
    state: { columns },
    nextCardNumber: Math.max(nextCardNumber, persistedCounter),
  };
}

function saveState(state: BoardState) {
  saveToStorage(STORAGE_KEYS.BOARD, state);
}

export function BoardProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  // Use lazy init to call loadState once and split state + counter
  const loadResult = useRef<LoadResult | null>(null);
  if (loadResult.current === null) {
    loadResult.current = loadState();
  }

  const { state, setState, undo, redo, canUndo, canRedo } =
    useUndoableState<BoardState>(() => loadResult.current!.state, {
      maxHistory: 50,
    });

  const nextCardNumberRef = useRef(loadResult.current.nextCardNumber);

  const saveCounter = useCallback((n: number) => {
    nextCardNumberRef.current = n;
    saveToStorage(STORAGE_KEYS.NEXT_CARD_NUMBER, n);
  }, []);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const mutations = useBoardMutations(setState, nextCardNumberRef, saveCounter);
  const { searchQuery, setSearchQuery, matchingCardIds } = useCardSearch(
    state.columns,
  );

  const value = useMemo<BoardContextValue>(
    () => ({
      columns: state.columns,
      ...mutations,
      setNextCardNumber: saveCounter,
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
      saveCounter,
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
