import { useBoard } from "../board/useBoard";
import { useUndoRedoKeyboard } from "../hooks";
import { tc } from "../theme/classNames";
import { UndoIcon, RedoIcon } from "./icons";

export function UndoRedoControls() {
  const { canUndo, canRedo, undo, redo } = useBoard();

  useUndoRedoKeyboard({ undo, redo, canUndo, canRedo });

  return (
    <div className="fixed bottom-12 right-4 z-10 flex gap-1">
      <button
        type="button"
        onClick={undo}
        disabled={!canUndo}
        aria-label="Undo"
        className={`h-8 w-8 rounded-full border backdrop-blur ${tc.iconButton} ${tc.border} ${tc.glass} disabled:opacity-30 disabled:pointer-events-none`}
      >
        <UndoIcon className="h-4 w-4" />
      </button>
      <button
        type="button"
        onClick={redo}
        disabled={!canRedo}
        aria-label="Redo"
        className={`h-8 w-8 rounded-full border backdrop-blur ${tc.iconButton} ${tc.border} ${tc.glass} disabled:opacity-30 disabled:pointer-events-none`}
      >
        <RedoIcon className="h-4 w-4" />
      </button>
    </div>
  );
}
