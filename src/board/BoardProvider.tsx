import { useCallback, useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { BoardContext } from "./BoardContext";
import type { BoardContextValue, BoardState, Card } from "./types";
import { getFromStorage, saveToStorage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storage";
import { isColumn } from "./validation";
import { migrateColumns } from "./migration";

const defaultState: BoardState = {
  columns: [],
};

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
  const [state, setState] = useState<BoardState>(() => loadState());
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    saveState(state);
  }, [state]);

  const addColumn = useCallback<BoardContextValue["addColumn"]>(
    (title = "") => {
      const now = Date.now();
      const id = crypto.randomUUID();
      setState((s) => ({
        columns: [
          ...s.columns,
          { id, title, cards: [], createdAt: now, updatedAt: now },
        ],
      }));
    },
    []
  );

  const updateColumn = useCallback<BoardContextValue["updateColumn"]>(
    (id, title) => {
      const now = Date.now();
      setState((s) => ({
        columns: s.columns.map((c) =>
          c.id === id ? { ...c, title, updatedAt: now } : c
        ),
      }));
    },
    []
  );

  const removeColumn = useCallback<BoardContextValue["removeColumn"]>(
    (id) => {
      setState((s) => ({ columns: s.columns.filter((c) => c.id !== id) }));
    },
    []
  );

  const setColumns = useCallback<BoardContextValue["setColumns"]>(
    (cols) => {
      setState({ columns: cols });
    },
    []
  );

  const addCard = useCallback<BoardContextValue["addCard"]>(
    (columnId, title = "") => {
      const now = Date.now();
      const card: Card = {
        id: crypto.randomUUID(),
        title,
        createdAt: now,
        updatedAt: now,
        columnHistory: [{ columnId, enteredAt: now }],
      };
      setState((s) => ({
        columns: s.columns.map((c) =>
          c.id === columnId
            ? { ...c, cards: [card, ...c.cards], updatedAt: now }
            : c
        ),
      }));
    },
    []
  );

  const removeCard = useCallback<BoardContextValue["removeCard"]>(
    (columnId, cardId) => {
      setState((prev) => {
        const idx = prev.columns.findIndex((c) => c.id === columnId);
        if (idx === -1) return prev;
        const col = prev.columns[idx];
        const newCards = col.cards.filter((c) => c.id !== cardId);
        if (newCards === col.cards) return prev;
        const now = Date.now();
        const newColumns = prev.columns.slice();
        newColumns[idx] = { ...col, cards: newCards, updatedAt: now };
        return { columns: newColumns };
      });
    },
    []
  );

  const updateCard = useCallback<BoardContextValue["updateCard"]>(
    (columnId, cardId, title) => {
      setState((prev) => {
        const idx = prev.columns.findIndex((c) => c.id === columnId);
        if (idx === -1) return prev;
        const col = prev.columns[idx];
        const cardIdx = col.cards.findIndex((c) => c.id === cardId);
        if (cardIdx === -1) return prev;
        const now = Date.now();
        const newCards = col.cards.slice();
        newCards[cardIdx] = { ...newCards[cardIdx], title, updatedAt: now };
        const newColumns = prev.columns.slice();
        newColumns[idx] = { ...col, cards: newCards, updatedAt: now };
        return { columns: newColumns };
      });
    },
    []
  );

  const sortCards = useCallback<BoardContextValue["sortCards"]>(
    (columnId) => {
      setState((prev) => {
        const idx = prev.columns.findIndex((c) => c.id === columnId);
        if (idx === -1) return prev;
        const col = prev.columns[idx];
        const now = Date.now();
        const nextCards = col.cards
          .slice()
          .sort((a, b) =>
            a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
          );
        const nextColumns = prev.columns.slice();
        nextColumns[idx] = { ...col, cards: nextCards, updatedAt: now };
        return { columns: nextColumns };
      });
    },
    []
  );

  const reorderCard = useCallback<BoardContextValue["reorderCard"]>(
    (columnId, activeCardId, overCardId) => {
      setState((prev) => {
        const colIdx = prev.columns.findIndex((c) => c.id === columnId);
        if (colIdx === -1) return prev;
        const col = prev.columns[colIdx];
        const fromIdx = col.cards.findIndex((c) => c.id === activeCardId);
        const toIdx = col.cards.findIndex((c) => c.id === overCardId);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
        const now = Date.now();
        const newCards = col.cards.slice();
        const [moved] = newCards.splice(fromIdx, 1);
        newCards.splice(toIdx, 0, { ...moved, updatedAt: now });
        const newColumns = prev.columns.slice();
        newColumns[colIdx] = { ...col, cards: newCards, updatedAt: now };
        return { columns: newColumns };
      });
    },
    []
  );

  const resetBoard = useCallback<BoardContextValue["resetBoard"]>(() => {
    setState(defaultState);
  }, []);

  // Fuzzy search for matching cards
  const matchingCardIds = useMemo(() => {
    if (searchQuery.trim().length < 2) {
      return new Set<string>();
    }

    // Flatten all cards with their IDs
    const allCards = state.columns.flatMap((col) => col.cards);

    // Configure Fuse for fuzzy search
    const fuse = new Fuse(allCards, {
      keys: ["title"],
      threshold: 0.4, // 0.0 = perfect match, 1.0 = match anything
      ignoreLocation: true,
    });

    const results = fuse.search(searchQuery);
    return new Set(results.map((result) => result.item.id));
  }, [searchQuery, state.columns]);

  const value = useMemo<BoardContextValue>(
    () => ({
      columns: state.columns,
      addColumn,
      updateColumn,
      removeColumn,
      addCard,
      removeCard,
      updateCard,
      setColumns,
      sortCards,
      reorderCard,
      resetBoard,
      searchQuery,
      setSearchQuery,
      matchingCardIds,
    }),
    [
      state.columns,
      addColumn,
      updateColumn,
      removeColumn,
      addCard,
      removeCard,
      updateCard,
      setColumns,
      sortCards,
      reorderCard,
      resetBoard,
      searchQuery,
      matchingCardIds,
    ]
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}
