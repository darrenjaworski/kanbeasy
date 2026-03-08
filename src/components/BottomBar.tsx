import { useBoard } from "../board/useBoard";
import { useUndoRedoKeyboard } from "../hooks";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";
import { UndoIcon, RedoIcon } from "./icons";
import { Tooltip } from "./shared/Tooltip";

const pillClass = `inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur text-xs ${tc.border} ${tc.glass}`;

export function BottomBar() {
  const { canUndo, canRedo, undo, redo } = useBoard();
  const { viewMode, keyboardShortcutsEnabled } = useTheme();

  useUndoRedoKeyboard({ undo, redo, canUndo, canRedo });

  const showUndoRedo = viewMode === "board";

  return (
    <div className="fixed bottom-4 right-4 z-10 flex gap-1">
      {keyboardShortcutsEnabled && (
        <div
          className={`${pillClass} ${tc.textFaint}`}
          data-testid="keyboard-shortcut-hint"
        >
          <kbd className="font-mono font-medium">⌘k</kbd>
          <span>Shortcuts</span>
        </div>
      )}
      {showUndoRedo && (
        <>
          <Tooltip content="Undo (⌘Z)" side="top" disabled={!canUndo}>
            <button
              type="button"
              onClick={undo}
              disabled={!canUndo}
              aria-label="Undo"
              className={`${pillClass} font-medium ${tc.bgHover} ${tc.text} ${tc.textHover} transition-colors disabled:opacity-30 disabled:pointer-events-none`}
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
              className={`${pillClass} font-medium ${tc.bgHover} ${tc.text} ${tc.textHover} transition-colors disabled:opacity-30 disabled:pointer-events-none`}
            >
              <RedoIcon className="h-4 w-4" />
              <span>Redo</span>
            </button>
          </Tooltip>
        </>
      )}
    </div>
  );
}
