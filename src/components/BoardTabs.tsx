import { useCallback, useEffect, useRef, useState } from "react";
import { useBoards } from "../boards/useBoards";
import { useBoardSwitchKeyboard } from "../hooks";
import { tc } from "../theme/classNames";
import { PlusIcon } from "./icons";

export function BoardTabs() {
  const {
    boards,
    activeBoardId,
    switchBoard,
    createBoard,
    deleteBoard,
    renameBoard,
    duplicateBoard,
  } = useBoards();

  useBoardSwitchKeyboard({ boards, activeBoardId, switchBoard });

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [creatingNew, setCreatingNew] = useState(false);
  const [newBoardTitle, setNewBoardTitle] = useState("");
  const [contextMenu, setContextMenu] = useState<{
    boardId: string;
    x: number;
    y: number;
  } | null>(null);

  const editInputRef = useRef<HTMLInputElement>(null);
  const newInputRef = useRef<HTMLInputElement>(null);
  const contextMenuRef = useRef<HTMLDivElement>(null);

  // Focus input when editing starts
  useEffect(() => {
    if (editingId && editInputRef.current) {
      editInputRef.current.focus();
      editInputRef.current.select();
    }
  }, [editingId]);

  useEffect(() => {
    if (creatingNew && newInputRef.current) {
      newInputRef.current.focus();
    }
  }, [creatingNew]);

  // Close context menu on outside click or Escape
  useEffect(() => {
    if (!contextMenu) return;
    const handleMouseDown = (e: MouseEvent) => {
      if (
        contextMenuRef.current &&
        !contextMenuRef.current.contains(e.target as Node)
      ) {
        setContextMenu(null);
      }
    };
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setContextMenu(null);
    };
    document.addEventListener("mousedown", handleMouseDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleMouseDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [contextMenu]);

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, boardId: string) => {
      e.preventDefault();
      setContextMenu({ boardId, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const startRename = useCallback(
    (id: string) => {
      const board = boards.find((b) => b.id === id);
      if (!board) return;
      setEditingId(id);
      setEditValue(board.title);
      setContextMenu(null);
    },
    [boards],
  );

  const commitRename = useCallback(() => {
    if (editingId && editValue.trim()) {
      renameBoard(editingId, editValue.trim());
    }
    setEditingId(null);
    setEditValue("");
  }, [editingId, editValue, renameBoard]);

  const handleDelete = useCallback(
    (id: string) => {
      setContextMenu(null);
      if (boards.length <= 1) return;
      const board = boards.find((b) => b.id === id);
      const confirmed = window.confirm(
        `Delete "${board?.title}"? This will permanently remove all columns, cards, and archived cards in this board.`,
      );
      if (confirmed) {
        deleteBoard(id);
      }
    },
    [boards, deleteBoard],
  );

  const handleDuplicate = useCallback(
    (id: string) => {
      setContextMenu(null);
      const board = boards.find((b) => b.id === id);
      if (board) {
        duplicateBoard(id, `${board.title} (copy)`);
      }
    },
    [boards, duplicateBoard],
  );

  const commitNewBoard = useCallback(() => {
    const title = newBoardTitle.trim();
    if (title) {
      createBoard(title);
    }
    setCreatingNew(false);
    setNewBoardTitle("");
  }, [newBoardTitle, createBoard]);

  return (
    <div
      className={`border-b ${tc.borderSubtle} bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60`}
    >
      <div className="mx-auto max-w-6xl px-4 flex items-center gap-1 overflow-x-auto scrollbar-thin">
        {boards.map((board) => (
          <button
            key={board.id}
            type="button"
            className={`relative shrink-0 px-3 py-2 text-sm font-medium transition-colors ${tc.focusRing} rounded-t-md ${
              board.id === activeBoardId
                ? `${tc.text} after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-accent`
                : `${tc.textMuted} ${tc.bgHover}`
            }`}
            onClick={() => switchBoard(board.id)}
            onContextMenu={(e) => handleContextMenu(e, board.id)}
            onDoubleClick={() => startRename(board.id)}
            aria-current={board.id === activeBoardId ? "page" : undefined}
            data-testid={`board-tab-${board.id}`}
          >
            {editingId === board.id ? (
              <input
                ref={editInputRef}
                type="text"
                className={`bg-transparent border-0 outline-hidden text-sm font-medium w-24 ${tc.text}`}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                onBlur={commitRename}
                onKeyDown={(e) => {
                  if (e.key === "Enter") commitRename();
                  if (e.key === "Escape") {
                    setEditingId(null);
                    setEditValue("");
                  }
                }}
              />
            ) : (
              board.title
            )}
          </button>
        ))}

        {creatingNew ? (
          <div className="shrink-0 px-1 py-2">
            <input
              ref={newInputRef}
              type="text"
              className={`bg-transparent border ${tc.border} rounded px-2 py-0.5 text-sm w-32 ${tc.text} ${tc.focusRing}`}
              placeholder="Board name..."
              value={newBoardTitle}
              onChange={(e) => setNewBoardTitle(e.target.value)}
              onBlur={commitNewBoard}
              onKeyDown={(e) => {
                if (e.key === "Enter") commitNewBoard();
                if (e.key === "Escape") {
                  setCreatingNew(false);
                  setNewBoardTitle("");
                }
              }}
            />
          </div>
        ) : (
          <button
            type="button"
            className={`shrink-0 p-2 rounded-md ${tc.iconButton} ${tc.textMuted}`}
            aria-label="Create new board"
            onClick={() => setCreatingNew(true)}
            data-testid="create-board-button"
          >
            <PlusIcon className="size-4" />
          </button>
        )}
      </div>

      {/* Context Menu */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          className={`fixed z-50 min-w-40 py-1 rounded-lg border ${tc.border} ${tc.glassOpaque} backdrop-blur-md shadow-lg`}
          style={{ left: contextMenu.x, top: contextMenu.y }}
        >
          <button
            type="button"
            className={`w-full text-left px-3 py-1.5 text-sm ${tc.text} ${tc.bgHover}`}
            onClick={() => startRename(contextMenu.boardId)}
          >
            Rename
          </button>
          <button
            type="button"
            className={`w-full text-left px-3 py-1.5 text-sm ${tc.text} ${tc.bgHover}`}
            onClick={() => handleDuplicate(contextMenu.boardId)}
          >
            Duplicate
          </button>
          {boards.length > 1 && (
            <button
              type="button"
              className={`w-full text-left px-3 py-1.5 text-sm text-red-600 dark:text-red-400 ${tc.bgHover}`}
              onClick={() => handleDelete(contextMenu.boardId)}
            >
              Delete
            </button>
          )}
        </div>
      )}
    </div>
  );
}
