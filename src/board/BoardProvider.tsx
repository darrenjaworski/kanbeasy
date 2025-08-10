import { useEffect, useMemo, useState } from "react";
import { BoardContext } from "./BoardContext";
import type { BoardContextValue, BoardState, Column } from "./types";

const STORAGE_KEY = "kanbeasy:board";

const defaultState: BoardState = {
  columns: [],
};

function isColumn(x: unknown): x is Column {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as { id?: unknown }).id === "string" &&
    typeof (x as { title?: unknown }).title === "string"
  );
}

function loadState(): BoardState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultState;
    const parsed = JSON.parse(raw) as { columns?: unknown };
    const cols = Array.isArray(parsed.columns)
      ? (parsed.columns as unknown[]).filter(isColumn)
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

  const addColumn: BoardContextValue["addColumn"] = (title = "") => {
    const id = crypto.randomUUID();
    setState((s) => ({ columns: [...s.columns, { id, title }] }));
  };
  const updateColumn: BoardContextValue["updateColumn"] = (id, title) => {
    setState((s) => ({
      columns: s.columns.map((c) => (c.id === id ? { ...c, title } : c)),
    }));
  };
  const removeColumn: BoardContextValue["removeColumn"] = (id) => {
    setState((s) => ({ columns: s.columns.filter((c) => c.id !== id) }));
  };
  const setColumns: BoardContextValue["setColumns"] = (cols) => {
    setState({ columns: cols });
  };
  const value = useMemo<BoardContextValue>(
    () => ({
      columns: state.columns,
      addColumn,
      updateColumn,
      removeColumn,
      setColumns,
    }),
    [state.columns]
  );

  return (
    <BoardContext.Provider value={value}>{children}</BoardContext.Provider>
  );
}
