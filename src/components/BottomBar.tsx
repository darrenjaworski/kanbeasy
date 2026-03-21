import { useBoard } from "../board/useBoard";
import { useUndoRedoKeyboard, useIsMobile } from "../hooks";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";
import { UndoIcon, RedoIcon } from "./icons";
import { Tooltip } from "./shared/Tooltip";

const pillClass = `inline-flex items-center gap-1.5 rounded-full border px-3 py-2.5 sm:py-1.5 backdrop-blur text-xs min-h-[44px] sm:min-h-0 ${tc.border} ${tc.glass}`;

interface BottomBarProps {
  onOpenCommandPalette: () => void;
}

export function BottomBar({ onOpenCommandPalette }: BottomBarProps) {
  const { canUndo, canRedo, undo, redo } = useBoard();
  const { viewMode, keyboardShortcutsEnabled } = useTheme();
  const isMobile = useIsMobile();

  useUndoRedoKeyboard({ undo, redo, canUndo, canRedo });

  const showUndoRedo = viewMode === "board";

  return (
    <div className="fixed bottom-4 right-4 z-10 flex gap-1">
      {keyboardShortcutsEnabled && !isMobile && (
        <button
          type="button"
          onClick={onOpenCommandPalette}
          className={`${pillClass} ${tc.textFaint} ${tc.bgHover} ${tc.textHover} cursor-pointer transition-colors`}
          data-testid="keyboard-shortcut-hint"
        >
          <kbd className="font-mono font-medium">⌘k</kbd>
          <span>Shortcuts</span>
        </button>
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
              <span className="hidden sm:inline">Undo</span>
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
              <span className="hidden sm:inline">Redo</span>
            </button>
          </Tooltip>
        </>
      )}
    </div>
  );
}
