import { useCallback, useEffect, useMemo, useRef } from "react";
import { BoardContext } from "./BoardContext";
import type { BoardContextValue, BoardState } from "./types";
import { getFromStorage, saveToStorage } from "../utils/storage";
import { boardStorageKey } from "../constants/storage";
import { isArchivedCard, isColumn } from "./validation";
import { migrateColumnsWithNumbering } from "./migration";
import { useUndoableState } from "./useUndoableState";
import { useBoardMutations } from "./useBoardMutations";
import { useCardSearch } from "./useCardSearch";
import { useBoards } from "../boards/useBoards";

type LoadResult = { state: BoardState; nextCardNumber: number };

function createEmptyBoard(): LoadResult {
  const now = Date.now();
  return {
    state: {
      archive: [],
      columns: [
        {
          id: crypto.randomUUID(),
          title: "To Do",
          createdAt: now,
          updatedAt: now,
          cards: [],
        },
        {
          id: crypto.randomUUID(),
          title: "In Progress",
          createdAt: now,
          updatedAt: now,
          cards: [],
        },
        {
          id: crypto.randomUUID(),
          title: "Done",
          createdAt: now,
          updatedAt: now,
          cards: [],
        },
      ],
    },
    nextCardNumber: 0,
  };
}

function createWelcomeBoard(): LoadResult {
  const now = Date.now();
  const todoId = crypto.randomUUID();
  const inProgressId = crypto.randomUUID();
  const doneId = crypto.randomUUID();

  return {
    state: {
      archive: [],
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
              cardTypeId: null,
              dueDate: null,
              createdAt: now,
              updatedAt: now,
              columnHistory: [{ columnId: todoId, enteredAt: now }],
            },
            {
              id: crypto.randomUUID(),
              number: 2,
              title: "Another task",
              description: "",
              cardTypeId: null,
              dueDate: null,
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
              cardTypeId: null,
              dueDate: null,
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
              cardTypeId: null,
              dueDate: null,
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

function loadState(
  storageKey: string,
  globalCounter: number,
  isFirstBoard: boolean,
): LoadResult {
  const raw =
    typeof window !== "undefined"
      ? window.localStorage.getItem(storageKey)
      : null;

  if (raw === null) {
    return isFirstBoard ? createWelcomeBoard() : createEmptyBoard();
  }

  const stored = getFromStorage<{ columns?: unknown; archive?: unknown }>(
    storageKey,
    {},
  );

  const cols = Array.isArray(stored.columns)
    ? (stored.columns as unknown[])
        .map((c) => {
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

  const rawArchive = Array.isArray(stored.archive)
    ? (stored.archive as unknown[]).filter(isArchivedCard)
    : [];

  const { columns, archive, nextCardNumber } = migrateColumnsWithNumbering(
    cols as unknown as Record<string, unknown>[],
    rawArchive as unknown as Record<string, unknown>[],
  );

  return {
    state: { columns, archive },
    nextCardNumber: Math.max(nextCardNumber, globalCounter),
  };
}

export function BoardProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const {
    boards,
    activeBoardId,
    nextCardNumber: globalCounter,
    setNextCardNumber: setGlobalCounter,
  } = useBoards();

  const storageKey = boardStorageKey(activeBoardId);
  const isFirstBoard = boards.length === 1 && boards[0].id === activeBoardId;

  // Track which board we're currently showing
  const currentBoardIdRef = useRef(activeBoardId);
  const loadResult = useRef<LoadResult | null>(null);
  if (loadResult.current === null) {
    loadResult.current = loadState(storageKey, globalCounter, isFirstBoard);
  }

  const { state, setState, undo, redo, canUndo, canRedo, reset } =
    useUndoableState<BoardState>(() => loadResult.current!.state, {
      maxHistory: 50,
    });

  const nextCardNumberRef = useRef(loadResult.current.nextCardNumber);

  // When the active board changes, reload state
  useEffect(() => {
    if (activeBoardId === currentBoardIdRef.current) return;
    currentBoardIdRef.current = activeBoardId;

    const key = boardStorageKey(activeBoardId);
    const result = loadState(key, globalCounter, false);
    nextCardNumberRef.current = result.nextCardNumber;
    reset(result.state);
  }, [activeBoardId, globalCounter, reset]);

  const saveCounter = useCallback(
    (n: number) => {
      nextCardNumberRef.current = n;
      setGlobalCounter(n);
    },
    [setGlobalCounter],
  );

  // Save board state to its storage key whenever it changes
  useEffect(() => {
    saveToStorage(boardStorageKey(currentBoardIdRef.current), state);
  }, [state]);

  const mutations = useBoardMutations(setState, nextCardNumberRef, saveCounter);
  const { searchQuery, setSearchQuery, matchingCardIds } = useCardSearch(
    state.columns,
  );

  const value = useMemo<BoardContextValue>(
    () => ({
      columns: state.columns,
      archive: state.archive,
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
      state.archive,
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
