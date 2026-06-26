import { useCallback, useMemo, useRef, useState } from "react";
import type { Card, CardUpdates } from "../../board/types";
import { useTheme } from "../../theme/useTheme";
import { useColumnResize } from "./useColumnResize";
import { useBoard } from "../../board/useBoard";
import { useClipboard } from "../../board/useClipboard";
import { DragIndicatorIcon, CloseIcon } from "../icons";
import { CardList } from "./CardList";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { Tooltip } from "../shared/Tooltip";
import { tc } from "../../theme/classNames";
import { useIsMobile } from "../../hooks";
import { ColumnCardCountBadge } from "./ColumnCardCountBadge";
import { ColumnTitleEdit } from "./ColumnTitleEdit";
import { ColumnResizeHandle } from "./ColumnResizeHandle";

type Props = Readonly<{
  id: string;
  title: string;
  cards: Card[];
  canDrag?: boolean;
  /** When false, the drag grip button is hidden (hold-to-drag mode) */
  showDragHandle?: boolean;
  dragHandleRef?: (el: HTMLButtonElement | null) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  overlayMode?: boolean;
  isDragging?: boolean;
  index?: number;
  columnCount?: number;
  onOpenDetail?: (cardId: string) => void;
  /** Mobile: expand to full available width instead of fixed w-80 */
  fullWidth?: boolean;
}>;

export function Column({
  id,
  title,
  cards,
  canDrag = true,
  showDragHandle = true,
  dragHandleRef,
  dragHandleProps,
  overlayMode = false,
  isDragging = false,
  index,
  columnCount,
  onOpenDetail,
  fullWidth = false,
}: Props) {
  const { width, onResizeMouseDown, stepWidth } = useColumnResize();
  const { addCard, removeColumn, archiveCard, updateCard } = useBoard();
  const { copiedCard, copyCard, pasteCard } = useClipboard();
  const {
    cardDensity,
    columnResizingEnabled,
    deleteColumnWarningEnabled,
    defaultCardTypeId,
    cardTypes,
  } = useTheme();
  const isMobile = useIsMobile();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [autoFocusCardId, setAutoFocusCardId] = useState<string | null>(null);

  // Keep a ref to the latest cards so onCopy can look one up without depending
  // on `cards` — that would change identity on every add/remove and re-render
  // the whole list. The handlers below stay referentially stable so the
  // memoized cards skip re-rendering when only the Column re-renders.
  const cardsRef = useRef(cards);
  cardsRef.current = cards;

  const handleCopy = useCallback(
    (cardId: string) => {
      const card = cardsRef.current.find((c) => c.id === cardId);
      if (card)
        copyCard({
          title: card.title,
          description: card.description,
          cardTypeId: card.cardTypeId,
          cardTypeLabel: card.cardTypeLabel,
          cardTypeColor: card.cardTypeColor,
          dueDate: card.dueDate,
        });
    },
    [copyCard],
  );
  const handleArchive = useCallback(
    (cardId: string) => archiveCard(id, cardId),
    [archiveCard, id],
  );
  const handleUpdate = useCallback(
    (cardId: string, updates: CardUpdates) => updateCard(id, cardId, updates),
    [updateCard, id],
  );
  const handleAutoFocused = useCallback(() => setAutoFocusCardId(null), []);
  const handleOpenDetail = useMemo(
    () => onOpenDetail ?? (() => {}),
    [onOpenDetail],
  );

  return (
    <section
      data-column-id={id}
      aria-label={title || "column"}
      className={
        `group relative rounded-lg border ${tc.border} p-3` +
        (fullWidth ? " w-full" : columnResizingEnabled ? "" : " w-80") +
        (overlayMode ? ` ${tc.glass} backdrop-blur-md` : " bg-surface")
      }
      style={!fullWidth && columnResizingEnabled ? { width } : undefined}
      data-testid={`column-${index}`}
    >
      {/* Combined drag + delete control */}
      <div
        className={`absolute right-2 top-2 z-2 inline-flex items-center border ${tc.border} ${tc.glassSubtle} backdrop-blur-sm rounded-full transition-opacity ${isMobile ? "opacity-100" : "opacity-0 group-hover:opacity-100 group-focus-within:opacity-100"}`}
      >
        {canDrag && showDragHandle && (
          <Tooltip
            content="Drag to reorder"
            disabled={isDragging || overlayMode}
          >
            <button
              type="button"
              ref={dragHandleRef}
              aria-label={`Drag column ${title || "column"}`}
              {...dragHandleProps}
              className={`${tc.iconButton} h-8 w-8 rounded-l-full hover:cursor-grab active:cursor-grabbing`}
              data-testid={`drag-column-button-${index}`}
            >
              <DragIndicatorIcon className="size-5" />
            </button>
          </Tooltip>
        )}
        {canDrag && showDragHandle && (
          <span aria-hidden className={`${tc.separator} h-6 w-px`} />
        )}
        <Tooltip content="Remove column" disabled={isDragging || overlayMode}>
          <button
            type="button"
            onClick={() =>
              deleteColumnWarningEnabled && cards.length > 0
                ? setShowDeleteConfirm(true)
                : removeColumn(id)
            }
            aria-label={`Remove column ${title || "column"}`}
            className={`${tc.iconButton} h-8 w-8 ${canDrag && showDragHandle ? "rounded-r-full" : "rounded-full"}`}
            data-testid={`delete-column-button-${index}`}
          >
            <CloseIcon className="size-5" />
          </button>
        </Tooltip>
      </div>

      <ColumnCardCountBadge
        cardCount={cards.length}
        index={index}
        columnCount={columnCount}
        isMobile={isMobile}
        canDrag={canDrag}
        showDragHandle={showDragHandle}
      />

      <ColumnTitleEdit id={id} title={title} index={index} />

      <div className="mb-3 flex gap-2">
        <button
          type="button"
          className={`flex-1 rounded-md border border-dashed ${tc.border} px-3 py-1.5 text-sm ${tc.textFaint} ${tc.textHover} ${tc.bgHover} transition-colors ${tc.focusRing}`}
          onClick={(e) => {
            const defaultType = defaultCardTypeId
              ? cardTypes.find((t) => t.id === defaultCardTypeId)
              : undefined;
            const cardId = addCard(
              id,
              "New card",
              defaultCardTypeId,
              defaultType?.label,
              defaultType?.color,
            );
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
        onCopy={handleCopy}
        onArchive={handleArchive}
        onUpdate={handleUpdate}
        onOpenDetail={handleOpenDetail}
        density={cardDensity}
        columnId={id}
        autoFocusCardId={autoFocusCardId}
        onAutoFocused={handleAutoFocused}
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

      {columnResizingEnabled && !fullWidth && (
        <ColumnResizeHandle
          onMouseDown={onResizeMouseDown}
          stepWidth={stepWidth}
          index={index}
        />
      )}
    </section>
  );
}
