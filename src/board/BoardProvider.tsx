import { useCallback, useEffect, useMemo, useState } from "react";
import Fuse from "fuse.js";
import { BoardContext } from "./BoardContext";
import type { BoardContextValue, BoardState, Card } from "./types";
import { getFromStorage, saveToStorage } from "../utils/storage";
import { STORAGE_KEYS } from "../constants/storage";
import { isColumn } from "./validation";

const defaultState: BoardState = {
  columns: [],
};

function createInitialBoard(): BoardState {
  return {
    columns: [
      {
        id: crypto.randomUUID(),
        title: "To Do",
        cards: [
          { id: crypto.randomUUID(), title: "My first task" },
          { id: crypto.randomUUID(), title: "Another task" },
        ],
      },
      {
        id: crypto.randomUUID(),
        title: "In Progress",
        cards: [
          { id: crypto.randomUUID(), title: "A task in progress" },
        ],
      },
      {
        id: crypto.randomUUID(),
        title: "Done",
        cards: [
          { id: crypto.randomUUID(), title: "A completed task" },
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

  return { columns: cols };
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
      const id = crypto.randomUUID();
      setState((s) => ({ columns: [...s.columns, { id, title, cards: [] }] }));
    },
    []
  );

  const updateColumn = useCallback<BoardContextValue["updateColumn"]>(
    (id, title) => {
      setState((s) => ({
        columns: s.columns.map((c) => (c.id === id ? { ...c, title } : c)),
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
      const card: Card = { id: crypto.randomUUID(), title };
      setState((s) => ({
        columns: s.columns.map((c) =>
          c.id === columnId ? { ...c, cards: [card, ...c.cards] } : c
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
        const newColumns = prev.columns.slice();
        newColumns[idx] = { ...col, cards: newCards };
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
        const newCards = col.cards.slice();
        newCards[cardIdx] = { ...newCards[cardIdx], title };
        const newColumns = prev.columns.slice();
        newColumns[idx] = { ...col, cards: newCards };
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
        const nextCards = col.cards
          .slice()
          .sort((a, b) =>
            a.title.localeCompare(b.title, undefined, { sensitivity: "base" })
          );
        const nextColumns = prev.columns.slice();
        nextColumns[idx] = { ...col, cards: nextCards };
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
        const newCards = col.cards.slice();
        const [moved] = newCards.splice(fromIdx, 1);
        newCards.splice(toIdx, 0, moved);
        const newColumns = prev.columns.slice();
        newColumns[colIdx] = { ...col, cards: newCards };
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
