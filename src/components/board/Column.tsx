import { useCallback, useEffect, useRef, useState } from "react";
import type { Card } from "../../board/types";
import { useTheme } from "../../theme/useTheme";
import {
  DEFAULT_COLUMN_WIDTH,
  MIN_COLUMN_WIDTH,
  MAX_COLUMN_WIDTH,
} from "../../constants/column";

import { useBoard } from "../../board/useBoard";
import { useClipboard } from "../../board/useClipboard";
import { DragIndicatorIcon, CloseIcon } from "../icons";
import { CardList } from "./CardList";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { Tooltip } from "../shared/Tooltip";
import { tc } from "../../theme/classNames";
import { useInlineEdit } from "../../hooks";
import { getBadgeHeat } from "./badgeHeat";

type Props = Readonly<{
  id: string;
  title: string;
  cards: Card[];
  canDrag?: boolean;
  dragHandleRef?: (el: HTMLButtonElement | null) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  overlayMode?: boolean;
  index?: number;
  columnCount?: number;
  onOpenDetail?: (cardId: string) => void;
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
  columnCount,
  onOpenDetail,
}: Props) {
  // Column resizing state
  const [width, setWidth] = useState<number>(DEFAULT_COLUMN_WIDTH);
  const resizing = useRef(false);
  const startX = useRef(0);
  const startWidth = useRef(DEFAULT_COLUMN_WIDTH);
  const { addCard, removeColumn, archiveCard, updateColumn, updateCard } =
    useBoard();
  const { copiedCard, copyCard, pasteCard } = useClipboard();
  const {
    cardDensity,
    columnResizingEnabled,
    deleteColumnWarningEnabled,
    defaultTicketTypeId,
  } = useTheme();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [autoFocusCardId, setAutoFocusCardId] = useState<string | null>(null);
  const [tempTitle, setTempTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTempTitle(title);
  }, [title]);
  const revertTitle = useCallback(() => setTempTitle(title), [title]);
  const saveTitle = useCallback(
    (value: string) => updateColumn(id, value),
    [id, updateColumn],
  );
  const { onKeyDown: titleKeyDown, onBlur: titleBlur } = useInlineEdit({
    originalValue: title,
    onSave: saveTitle,
    onRevert: revertTitle,
  });
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
        (overlayMode ? ` ${tc.glass} backdrop-blur-md` : " bg-surface")
      }
      style={columnResizingEnabled ? { width } : undefined}
      data-testid={`column-${index}`}
    >
      {/* Combined drag + delete control */}
      <div
        className={`absolute right-2 top-2 z-2 inline-flex items-center border ${tc.border} ${tc.glassSubtle} backdrop-blur-sm rounded-full opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100`}
      >
        {canDrag && (
          <Tooltip content="Drag to reorder">
            <button
              type="button"
              ref={dragHandleRef}
              aria-label={`Drag column ${title || "column"}`}
              {...(dragHandleProps as unknown as React.HTMLAttributes<HTMLButtonElement>)}
              className={`${tc.iconButton} h-8 w-8 rounded-l-full hover:cursor-grab active:cursor-grabbing`}
              data-testid={`drag-column-button-${index}`}
            >
              <DragIndicatorIcon className="size-5" />
            </button>
          </Tooltip>
        )}
        {canDrag && <span aria-hidden className={`${tc.separator} h-6 w-px`} />}
        <Tooltip content="Remove column">
          <button
            type="button"
            onClick={() =>
              deleteColumnWarningEnabled && cards.length > 0
                ? setShowDeleteConfirm(true)
                : removeColumn(id)
            }
            aria-label={`Remove column ${title || "column"}`}
            className={`${tc.iconButton} h-8 w-8 ${canDrag ? "rounded-r-full" : "rounded-full"}`}
            data-testid={`delete-column-button-${index}`}
          >
            <CloseIcon className="size-5" />
          </button>
        </Tooltip>
      </div>
      {/* Card count badge — slides left on hover to clear controls */}
      {(() => {
        const heat = getBadgeHeat(cards.length, index, columnCount);
        return (
          <span
            className={`absolute right-2 top-2 z-1 inline-flex h-8 min-w-8 items-center justify-center rounded-full border ${tc.border} ${heat ? "" : tc.glassSubtle} backdrop-blur-sm px-2.5 text-sm ${heat?.bold ? "font-bold" : "font-medium"} ${heat ? tc.text : tc.textFaint} transition-[right] duration-200 ease-in-out ${canDrag ? "group-hover:right-20 group-focus-within:right-20" : "group-hover:right-12 group-focus-within:right-12"}`}
            style={
              heat
                ? {
                    backgroundColor: `color-mix(in srgb, var(--color-accent) ${heat.accentPercent}%, transparent)`,
                  }
                : undefined
            }
            aria-label={`${cards.length} card${cards.length === 1 ? "" : "s"}`}
          >
            {cards.length}
          </span>
        );
      })()}
      <div className="mb-3 mr-8">
        <input
          ref={inputRef}
          type="text"
          aria-label="Column title"
          className={`${tc.input} w-full px-0 py-0 text-base font-semibold tracking-tight opacity-80 rounded-xs`}
          value={tempTitle}
          onFocus={(e) => e.target.select()}
          onChange={(e) => setTempTitle(e.target.value)}
          id={`${id}-title`}
          onKeyDown={titleKeyDown}
          onBlur={titleBlur}
          data-testid={`column-title-input-${index}`}
        />
      </div>
      <div className="mb-3 flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded-md border border-dashed ${tc.border} px-3 py-1.5 text-sm ${tc.textFaint} ${tc.textHover} ${tc.bgHover} transition-colors ${tc.focusRing}`}
          onClick={(e) => {
            const cardId = addCard(id, "New card", defaultTicketTypeId);
            setAutoFocusCardId(cardId);
            e.currentTarget.blur();
          }}
          aria-label={`Add card to ${title || "column"}`}
          data-testid={`add-card-button-${index}`}
        >
          {copiedCard ? "+ New" : "+ Add card"}
        </button>
        {copiedCard && (
          <button
            type="button"
            className={`flex-1 rounded-md border border-dashed ${tc.border} px-3 py-1.5 text-sm ${tc.textFaint} ${tc.textHover} ${tc.bgHover} transition-colors ${tc.focusRing}`}
            onClick={(e) => {
              const cardId = pasteCard(id);
              if (cardId) setAutoFocusCardId(cardId);
              e.currentTarget.blur();
            }}
            aria-label={`Paste card to ${title || "column"}`}
            data-testid={`paste-card-button-${index}`}
          >
            + Paste
          </button>
        )}
      </div>
      <CardList
        cards={cards}
        onCopy={(cardId) => {
          const card = cards.find((c) => c.id === cardId);
          if (card)
            copyCard({
              title: card.title,
              description: card.description,
              ticketTypeId: card.ticketTypeId,
            });
        }}
        onArchive={(cardId) => archiveCard(id, cardId)}
        onUpdate={(cardId, updates) => updateCard(id, cardId, updates)}
        onOpenDetail={onOpenDetail ?? (() => {})}
        density={cardDensity}
        columnId={id}
        autoFocusCardId={autoFocusCardId}
        onAutoFocused={() => setAutoFocusCardId(null)}
      />
      <ConfirmDialog
        open={showDeleteConfirm}
        onClose={() => setShowDeleteConfirm(false)}
        onConfirm={() => {
          setShowDeleteConfirm(false);
          removeColumn(id);
        }}
        title="Remove column?"
        confirmLabel="Remove"
        message={`This column has ${cards.length} card${cards.length === 1 ? "" : "s"}. Its cards will be archived and can be restored later.`}
      />
      {/* Resize handle (feature-flagged) */}
      {/* eslint-disable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex -- separator with tabIndex is an interactive resize widget */}
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
          <div
            className={`mx-auto h-full w-1 rounded-md ${tc.separator} opacity-60 hover:opacity-100 transition-opacity`}
          />
        </div>
      )}
      {/* eslint-enable jsx-a11y/no-noninteractive-element-interactions, jsx-a11y/no-noninteractive-tabindex */}
    </section>
  );
}
