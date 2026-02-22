import { useCallback, useRef, useState } from "react";

type HistoryState<T> = {
  past: T[];
  present: T;
  future: T[];
};

type UseUndoableStateOptions = {
  enabled?: boolean;
  maxHistory?: number;
};

type UseUndoableStateReturn<T> = {
  state: T;
  setState: React.Dispatch<React.SetStateAction<T>>;
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

export function useUndoableState<T>(
  initialState: T | (() => T),
  options: UseUndoableStateOptions = {},
): UseUndoableStateReturn<T> {
  const { enabled = true, maxHistory = 50 } = options;

  const [history, setHistory] = useState<HistoryState<T>>(() => {
    const initial =
      typeof initialState === "function"
        ? (initialState as () => T)()
        : initialState;
    return { past: [], present: initial, future: [] };
  });

  // Track enabled in a ref so the setState callback always sees the latest value
  const enabledRef = useRef(enabled);
  enabledRef.current = enabled;
  const maxHistoryRef = useRef(maxHistory);
  maxHistoryRef.current = maxHistory;

  const setState: React.Dispatch<React.SetStateAction<T>> = useCallback(
    (action) => {
      setHistory((prev) => {
        const next =
          typeof action === "function"
            ? (action as (prev: T) => T)(prev.present)
            : action;

        // No-op detection: skip if reference is unchanged
        if (next === prev.present) return prev;

        if (!enabledRef.current) {
          return { past: prev.past, present: next, future: prev.future };
        }

        const newPast = [...prev.past, prev.present];
        if (newPast.length > maxHistoryRef.current) {
          newPast.splice(0, newPast.length - maxHistoryRef.current);
        }

        return { past: newPast, present: next, future: [] };
      });
    },
    [],
  );

  const undo = useCallback(() => {
    setHistory((prev) => {
      if (prev.past.length === 0) return prev;
      const newPresent = prev.past[prev.past.length - 1];
      return {
        past: prev.past.slice(0, -1),
        present: newPresent,
        future: [prev.present, ...prev.future],
      };
    });
  }, []);

  const redo = useCallback(() => {
    setHistory((prev) => {
      if (prev.future.length === 0) return prev;
      const newPresent = prev.future[0];
      return {
        past: [...prev.past, prev.present],
        present: newPresent,
        future: prev.future.slice(1),
      };
    });
  }, []);

  const canUndo = enabled && history.past.length > 0;
  const canRedo = enabled && history.future.length > 0;

  return { state: history.present, setState, undo, redo, canUndo, canRedo };
}
