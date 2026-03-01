import { useBoard } from "../board/useBoard";
import { useUndoRedoKeyboard } from "../hooks";
import { tc } from "../theme/classNames";
import { UndoIcon, RedoIcon } from "./icons";
import { Tooltip } from "./shared/Tooltip";

export function UndoRedoControls() {
  const { canUndo, canRedo, undo, redo } = useBoard();

  useUndoRedoKeyboard({ undo, redo, canUndo, canRedo });

  return (
    <div className="fixed bottom-4 right-4 z-10 flex gap-1">
      <Tooltip content="Undo (⌘Z)" side="top" disabled={!canUndo}>
        <button
          type="button"
          onClick={undo}
          disabled={!canUndo}
          aria-label="Undo"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur text-xs font-medium ${tc.border} ${tc.glass} ${tc.bgHover} ${tc.text} ${tc.textHover} transition-colors disabled:opacity-30 disabled:pointer-events-none`}
        >
          <UndoIcon className="h-4 w-4" />
          <span>Undo</span>
        </button>
      </Tooltip>
      <Tooltip content="Redo (⌘⇧Z)" side="top" disabled={!canRedo}>
        <button
          type="button"
          onClick={redo}
          disabled={!canRedo}
          aria-label="Redo"
          className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur text-xs font-medium ${tc.border} ${tc.glass} ${tc.bgHover} ${tc.text} ${tc.textHover} transition-colors disabled:opacity-30 disabled:pointer-events-none`}
        >
          <RedoIcon className="h-4 w-4" />
          <span>Redo</span>
        </button>
      </Tooltip>
    </div>
  );
}
