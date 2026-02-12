import { useCallback, useEffect, useMemo, useState } from "react";
import { BoardContext } from "./BoardContext";
import type { BoardContextValue, BoardState, Column, Card } from "./types";

const STORAGE_KEY = "kanbeasy:board";

const defaultState: BoardState = {
  columns: [],
};

function isCard(x: unknown): x is Card {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as { id?: unknown }).id === "string" &&
    typeof (x as { title?: unknown }).title === "string"
  );
}

function isColumn(x: unknown): x is Column {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as { id?: unknown }).id === "string" &&
    typeof (x as { title?: unknown }).title === "string" &&
    Array.isArray((x as { cards?: unknown }).cards) &&
    ((x as { cards?: unknown }).cards as unknown[]).every(isCard)
  );
}

function loadState(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as { columns?: unknown };
    const cols = Array.isArray(parsed.columns)
      ? (parsed.columns as unknown[])
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
  } catch {
    return defaultState;
  }
}

function saveState(state: BoardState) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

export function BoardProvider({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  const [state, setState] = useState<BoardState>(() => loadState());

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
    ]
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}
