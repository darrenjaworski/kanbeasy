import { useCallback } from "react";
import type {
  ArchivedCard,
  BoardContextValue,
  BoardState,
  Column,
} from "./types";

const defaultState: BoardState = { columns: [], archive: [] };

export function useColumnMutations(
  setState: React.Dispatch<React.SetStateAction<BoardState>>,
) {
  const addColumn = useCallback<BoardContextValue["addColumn"]>(
    (title = "") => {
      const now = Date.now();
      const id = crypto.randomUUID();
      setState((s) => ({
        ...s,
        columns: [
          ...s.columns,
          { id, title, cards: [], createdAt: now, updatedAt: now },
        ],
      }));
    },
    [setState],
  );

  const updateColumn = useCallback<BoardContextValue["updateColumn"]>(
    (id, title) => {
      const now = Date.now();
      setState((s) => ({
        ...s,
        columns: s.columns.map((c) =>
          c.id === id ? { ...c, title, updatedAt: now } : c,
        ),
      }));
    },
    [setState],
  );

  const removeColumn = useCallback<BoardContextValue["removeColumn"]>(
    (id) => {
      setState((s) => {
        const col = s.columns.find((c) => c.id === id);
        const now = Date.now();
        const newArchived: ArchivedCard[] = (col?.cards ?? []).map((card) => ({
          ...card,
          archivedAt: now,
          archivedFromColumnId: id,
        }));
        return {
          ...s,
          columns: s.columns.filter((c) => c.id !== id),
          archive: [...s.archive, ...newArchived],
        };
      });
    },
    [setState],
  );

  const setColumns = useCallback<BoardContextValue["setColumns"]>(
    (cols: Column[], archive?: ArchivedCard[]) => {
      setState((s) => ({
        ...s,
        columns: cols,
        ...(archive !== undefined ? { archive } : {}),
      }));
    },
    [setState],
  );

  const resetBoard = useCallback<BoardContextValue["resetBoard"]>(() => {
    setState(defaultState);
  }, [setState]);

  return { addColumn, updateColumn, removeColumn, setColumns, resetBoard };
}
