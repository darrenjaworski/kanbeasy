import { useEffect, useRef, useState } from "react";
import type { Card } from "../board/types";
import { useTheme } from "../theme/useTheme";
import {
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  MAX_COLUMN_WIDTH,
} from "../constants/column";

import { useBoard } from "../board/useBoard";
import { DragIndicatorIcon } from "./icons/DragIndicatorIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { CardList } from "./CardList";
import { ConfirmDialog } from "./ConfirmDialog";
import { tc } from "../theme/classNames";

type Props = Readonly<{
  id: string;
  title: string;
  cards: Card[];
  canDrag?: boolean;
  dragHandleRef?: (el: HTMLButtonElement | null) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  overlayMode?: boolean;
  index?: number;
}>;

export function Column({
  id,
  title,
  cards,
  canDrag = true,
  dragHandleRef,
  dragHandleProps,
  overlayMode = false,
  index,
}: Props) {
  // Column resizing state
  const [width, setWidth] = useState<number>(DEFAULT_COLUMN_WIDTH);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_COLUMN_WIDTH);
  const { addCard, removeColumn, removeCard, updateColumn, updateCard } =
    useBoard();
  const { cardDensity, columnResizingEnabled, deleteColumnWarningEnabled } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [tempTitle, setTempTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTempTitle(title);
  }, [title]);
  // Mouse event handlers for resizing
  const onResizeMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    resizing.current = true;
    startX.current = e.clientX;
    startWidth.current = width;
    document.body.style.cursor = "col-resize";
    window.addEventListener("mousemove", onResizeMouseMove);
    window.addEventListener("mouseup", onResizeMouseUp);
  };

  const onResizeMouseMove = (e: MouseEvent) => {
    if (!resizing.current) return;
    const delta = e.clientX - startX.current;
    let newWidth = startWidth.current + delta;
    newWidth = Math.max(MIN_COLUMN_WIDTH, Math.min(MAX_COLUMN_WIDTH, newWidth));
    setWidth(newWidth);
  };

  const onResizeMouseUp = () => {
    resizing.current = false;
    document.body.style.cursor = "";
    window.removeEventListener("mousemove", onResizeMouseMove);
    window.removeEventListener("mouseup", onResizeMouseUp);
  };

  useEffect(() => {
    return () => {
      // Clean up listeners if unmounted while resizing
      window.removeEventListener("mousemove", onResizeMouseMove);
      window.removeEventListener("mouseup", onResizeMouseUp);
      document.body.style.cursor = "";
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <section
      data-column-id={id}
      aria-label={title || "column"}
      className={
        `group relative rounded-lg border ${tc.border} p-3` +
        (columnResizingEnabled ? "" : " w-80") +
        (overlayMode
          ? ` ${tc.glass} backdrop-blur-md`
          : " bg-surface")
      }
      style={columnResizingEnabled ? { width } : undefined}
      data-testid={`column-${index}`}
    >
      {/* Combined drag + delete control */}
      <div className={`absolute right-2 top-2 z-1 ${tc.buttonGroup} rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100`}>
        {canDrag && (
          <button
            type="button"
            ref={dragHandleRef}
            aria-label={`Drag column ${title || "column"}`}
            title="Drag to reorder"
            {...(dragHandleProps as unknown as React.HTMLAttributes<HTMLButtonElement>)}
            className={`${tc.iconButton} h-8 w-8 hover:cursor-grab active:cursor-grabbing`}
            data-testid={`drag-column-button-${index}`}
          >
            <DragIndicatorIcon className="size-5" />
          </button>
        )}
        {canDrag && (
          <span aria-hidden className={`${tc.separator} h-6 w-px`} />
        )}
        <button
          type="button"
          onClick={() =>
            deleteColumnWarningEnabled && cards.length > 0
              ? setShowDeleteConfirm(true)
              : removeColumn(id)
          }
          aria-label={`Remove column ${title || "column"}`}
          title="Remove column"
          className={`${tc.iconButton} h-8 w-8`}
          data-testid={`delete-column-button-${index}`}
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
      {/* Card count badge — slides left on hover to clear controls */}
      <span
        className={`absolute right-2 top-2 inline-flex h-8 min-w-8 items-center justify-center rounded-full border ${tc.border} ${tc.glass} px-2.5 text-sm font-medium ${tc.textFaint} transition-[right] duration-200 ease-in-out group-hover:right-20`}
        aria-label={`${cards.length} card${cards.length === 1 ? "" : "s"}`}
      >
        {cards.length}
      </span>
      <div className="mb-3 mr-16">
        <input
          ref={inputRef}
          type="text"
          aria-label="Column title"
          className={`${tc.input} w-full px-0 py-0 text-base font-semibold tracking-tight opacity-80 rounded-xs`}
          value={tempTitle}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setTempTitle(e.target.value)}
          id={`${id}-title`}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
            }
            if (e.key === "Escape") {
              setTempTitle(title);
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          onBlur={() => {
            const next = tempTitle.trim();
            if (!next) {
              setTempTitle(title);
              return;
            }
            if (next !== title) updateColumn(id, next);
          }}
          data-testid={`column-title-input-${index}`}
        />
      </div>
      <div className="mb-3">
        <button
          type="button"
          className={`${tc.button} w-full rounded-md px-3 py-1.5`}
          onClick={() => addCard(id, "New card")}
          aria-label={`Add card to ${title || "column"}`}
          data-testid={`add-card-button-${index}`}
        >
          Add card
        </button>
      </div>
      <CardList
        cards={cards}
        onRemove={(cardId) => removeCard(id, cardId)}
        onUpdate={(cardId, title) => updateCard(id, cardId, title)}
        density={cardDensity}
        columnId={id}
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          removeColumn(id);
        }}
        title="Delete column?"
        message={`This column has ${cards.length} card${cards.length === 1 ? "" : "s"}. Deleting it will remove them permanently.`}
      />
      {/* Resize handle (feature-flagged) */}
      {columnResizingEnabled && (
        <div
          className="absolute top-0 pt-[8px] pb-[8px] right-0 h-full w-2 cursor-col-resize z-10 group/resizer"
          style={{
            marginRight: -8,
            touchAction: "none",
          }}
          onMouseDown={onResizeMouseDown}
          aria-label="Resize column"
          role="separator"
          tabIndex={0}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight")
              setWidth((w) => Math.min(MAX_COLUMN_WIDTH, w + 10));
            if (e.key === "ArrowLeft")
              setWidth((w) => Math.max(MIN_COLUMN_WIDTH, w - 10));
          }}
          data-testid={`resize-handle-${index}`}
        >
          <div className={`mx-auto h-full w-1 rounded-md ${tc.separator} opacity-60 hover:opacity-100 transition-opacity`} />
        </div>
      )}
    </section>
  );
}
