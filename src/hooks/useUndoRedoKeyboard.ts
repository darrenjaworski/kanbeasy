import { useEffect, useRef } from "react";

type UseUndoRedoKeyboardOptions = {
  undo: () => void;
  redo: () => void;
  canUndo: boolean;
  canRedo: boolean;
};

function isEditableTarget(target: EventTarget | null): boolean {
  if (!(target instanceof HTMLElement)) return false;
  const tag = target.tagName;
  if (tag === "INPUT" || tag === "TEXTAREA") return true;
  if (target.isContentEditable || target.contentEditable === "true") return true;
  return false;
}

export function useUndoRedoKeyboard({
  undo,
  redo,
  canUndo,
  canRedo,
}: UseUndoRedoKeyboardOptions) {
  const callbacksRef = useRef({ undo, redo, canUndo, canRedo });
  callbacksRef.current = { undo, redo, canUndo, canRedo };

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.key !== "z") return;
      if (isEditableTarget(e.target)) return;

      e.preventDefault();
      if (e.shiftKey) {
        if (callbacksRef.current.canRedo) callbacksRef.current.redo();
      } else {
        if (callbacksRef.current.canUndo) callbacksRef.current.undo();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, []);
}
