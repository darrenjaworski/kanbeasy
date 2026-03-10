import { useCallback, useEffect, useMemo, useRef } from "react";
import { BoardContext } from "./BoardContext";
import type { BoardContextValue, BoardState } from "./types";
import { kvGet, kvSet, getBoard, saveBoard } from "../utils/db";
import { STORAGE_KEYS } from "../constants/storage";
import { isArchivedCard, isColumn } from "./validation";
import { migrateColumnsWithNumbering } from "./migration";
import { useUndoableState } from "./useUndoableState";
import { useBoardMutations } from "./useBoardMutations";
import { useCardSearch } from "./useCardSearch";

type LoadResult = { state: BoardState; nextCardNumber: number };

/** Return an ISO date string N days from now. */
function daysFromNow(days: number): string {
  const d = new Date();
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

function createInitialBoard(): LoadResult {
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
              title: "Plan the project",
              description:
                "Break the work into small tasks:\n\n- [ ] Define goals\n- [ ] Identify milestones\n- [ ] Estimate effort",
              cardTypeId: "feat",
              cardTypeLabel: "Feature",
              cardTypeColor: "#22c55e",
              dueDate: daysFromNow(7),
              createdAt: now,
              updatedAt: now,
              columnHistory: [{ columnId: todoId, enteredAt: now }],
            },
            {
              id: crypto.randomUUID(),
              number: 2,
              title: "Write documentation",
              description:
                "Add a README with setup instructions and usage examples.",
              cardTypeId: "chore",
              cardTypeLabel: "Chore",
              cardTypeColor: "#64748b",
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
              title: "Build the dashboard",
              description:
                "Progress so far:\n\n- [x] Layout scaffolding\n- [x] Header component\n- [ ] Data fetching\n- [ ] Charts",
              cardTypeId: "feat",
              cardTypeLabel: "Feature",
              cardTypeColor: "#22c55e",
              dueDate: daysFromNow(3),
              createdAt: now - 2 * 86_400_000,
              updatedAt: now,
              columnHistory: [
                { columnId: todoId, enteredAt: now - 2 * 86_400_000 },
                { columnId: inProgressId, enteredAt: now - 86_400_000 },
              ],
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
              title: "Set up the repo",
              description: "",
              cardTypeId: "chore",
              cardTypeLabel: "Chore",
              cardTypeColor: "#64748b",
              dueDate: null,
              createdAt: now - 3 * 86_400_000,
              updatedAt: now - 86_400_000,
              columnHistory: [
                { columnId: todoId, enteredAt: now - 3 * 86_400_000 },
                { columnId: inProgressId, enteredAt: now - 2 * 86_400_000 },
                { columnId: doneId, enteredAt: now - 86_400_000 },
              ],
            },
          ],
        },
      ],
    },
    nextCardNumber: 5,
  };
}

function loadState(): LoadResult {
  // Read from db cache (populated by AppLoader's openDatabase() call)
  const stored = getBoard();

  if (stored === null) {
    const result = createInitialBoard();
    // Write the initial board to the cache so getBoard() returns it,
    // and to IDB so it persists across reloads.
    saveBoard(result.state);
    return result;
  }

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

  const rawArchive = Array.isArray(stored.archive)
    ? (stored.archive as unknown[]).filter(isArchivedCard)
    : [];

  // Migrate timestamps and assign card numbers
  const { columns, archive, nextCardNumber } = migrateColumnsWithNumbering(
    cols as unknown as Record<string, unknown>[],
    rawArchive as unknown as Record<string, unknown>[],
  );

  // Reconcile with persisted counter (take the max)
  const persistedCounter = kvGet<number>(STORAGE_KEYS.NEXT_CARD_NUMBER, 0);

  return {
    state: { columns, archive },
    nextCardNumber: Math.max(nextCardNumber, persistedCounter),
  };
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
    kvSet(STORAGE_KEYS.NEXT_CARD_NUMBER, n);
  }, []);

  const initialStateRef = useRef(state);
  useEffect(() => {
    // Skip when state is still the initial reference — the data was just read
    // from IDB (or freshly created and cached by loadState), no need to write
    // it back. Only persist when the user actually changes state.
    if (state === initialStateRef.current) return;
    saveBoard(state);
  }, [state]);

  const mutations = useBoardMutations(setState, nextCardNumberRef, saveCounter);
  const {
    searchQuery,
    setSearchQuery,
    matchingCardIds,
    selectedTypeIds,
    setSelectedTypeIds,
    clearTypeFilter,
    isFilterActive,
  } = useCardSearch(state.columns);

  const value = useMemo<BoardContextValue>(
    () => ({
      columns: state.columns,
      archive: state.archive,
      ...mutations,
      setNextCardNumber: saveCounter,
      searchQuery,
      setSearchQuery,
      matchingCardIds,
      selectedTypeIds,
      setSelectedTypeIds,
      clearTypeFilter,
      isFilterActive,
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
      selectedTypeIds,
      setSelectedTypeIds,
      clearTypeFilter,
      isFilterActive,
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
