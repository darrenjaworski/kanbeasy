import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  memo,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import type { Card, CardUpdates } from "../../board/types";
import { ROWS_FOR_DENSITY, type CardDensity } from "../../theme/types";
import { CardControls } from "./CardControls";
import { tc } from "../../theme/classNames";
import { useInlineEdit, useIsMobile } from "../../hooks";
import { useTheme } from "../../theme/useTheme";
import { asDOMAttributes } from "../../utils/dnd";
import { ChecklistProgress } from "../shared/ChecklistProgress";
import { DueDateBadge } from "../shared/DueDateBadge";
import { CardTypeBadge } from "../shared/CardTypeBadge";

type SortableCardItemProps = Readonly<{
  card: Card;
  onCopy: (cardId: string) => void;
  onArchive: (cardId: string) => void;
  onUpdate: (cardId: string, updates: CardUpdates) => void;
  onOpenDetail: (cardId: string) => void;
  canDrag?: boolean;
  density: CardDensity;
  columnId: string;
  index: number;
  isSearchMatch?: boolean;
  autoFocus?: boolean;
  onAutoFocused?: () => void;
}>;

function SortableCardItemImpl({
  card,
  onCopy,
  onArchive,
  onUpdate,
  onOpenDetail,
  canDrag = true,
  density,
  columnId,
  index,
  isSearchMatch = false,
  autoFocus = false,
  onAutoFocused,
}: SortableCardItemProps) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id, data: { type: "card", columnId } });

  const style: CSSProperties = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 5 : undefined,
    }),
    [transform, transition, isDragging],
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardValue = card.title || "New card";

  // Sync uncontrolled textarea when title changes externally (e.g. from modal)
  const prevTitle = useRef(card.title);
  if (prevTitle.current !== card.title) {
    prevTitle.current = card.title;
    if (textareaRef.current && document.activeElement !== textareaRef.current) {
      textareaRef.current.value = cardValue;
    }
  }

  // Stable per-card handlers: the parent passes a single callback reference for
  // the whole list, and each card binds its own id here without creating fresh
  // closures on every parent render (which would defeat memoization).
  const handleCopy = useCallback(() => onCopy(card.id), [onCopy, card.id]);
  const handleArchive = useCallback(
    () => onArchive(card.id),
    [onArchive, card.id],
  );
  const handleOpenDetail = useCallback(
    () => onOpenDetail(card.id),
    [onOpenDetail, card.id],
  );

  const revertCard = useCallback(() => {
    if (textareaRef.current) textareaRef.current.value = cardValue;
  }, [cardValue]);
  const saveCard = useCallback(
    (value: string) => onUpdate(card.id, { title: value }),
    [onUpdate, card.id],
  );
  const { onKeyDown: cardKeyDown, onBlur: cardBlur } = useInlineEdit({
    originalValue: card.title,
    onSave: saveCard,
    onRevert: revertCard,
    multiline: true,
  });

  useEffect(() => {
    if (autoFocus && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
      onAutoFocused?.();
    }
  }, [autoFocus, onAutoFocused]);

  const isMobile = useIsMobile();
  const { holdToDragEnabled } = useTheme();
  const rowsForDensity = ROWS_FOR_DENSITY[density];

  const rootDragProps =
    canDrag && holdToDragEnabled && !isMobile
      ? {
          ref: (el: HTMLDivElement | null) => {
            setNodeRef(el);
            setActivatorNodeRef(el);
          },
          ...asDOMAttributes<HTMLDivElement>(attributes, listeners),
        }
      : { ref: setNodeRef };

  return (
    <div
      {...rootDragProps}
      style={style}
      className={`group/card relative rounded-md border p-2 text-sm ${
        isSearchMatch
          ? `border-accent ${tc.searchHighlight}`
          : `${tc.border} ${tc.glass}`
      } ${
        isDragging
          ? "backdrop-blur-xs supports-[backdrop-filter]:bg-white/40 supports-[backdrop-filter]:dark:bg-black/30"
          : ""
      }`}
      data-testid={`card-${index}`}
      data-search-highlight={isSearchMatch || undefined}
    >
      <CardTypeBadge
        number={card.number}
        cardTypeId={card.cardTypeId}
        cardTypeColor={card.cardTypeColor}
      />

      {!isDragging && (
        <CardControls
          index={index}
          canDrag={canDrag}
          showDragHandle={!holdToDragEnabled}
          cardTitle={card.title}
          onCopy={handleCopy}
          onArchive={handleArchive}
          onOpenDetail={handleOpenDetail}
          setActivatorNodeRef={setActivatorNodeRef}
          attributes={attributes}
          listeners={listeners}
        />
      )}

      {isMobile ? (
        <button
          type="button"
          onClick={handleOpenDetail}
          className={`mt-1 w-full text-left text-sm ${tc.text} leading-snug`}
          data-testid={`card-content-${index}`}
        >
          {cardValue}
        </button>
      ) : (
        <textarea
          ref={textareaRef}
          id={`${columnId}-${card.id}-content`}
          aria-label="Card content"
          defaultValue={cardValue}
          className={`${tc.input} mt-1 w-full resize-none hover:resize-y focus:resize-y rounded-xs`}
          rows={rowsForDensity}
          style={density === "dynamic" ? { fieldSizing: "content" } : undefined}
          onKeyDown={cardKeyDown}
          onBlur={cardBlur}
          data-testid={`card-content-${index}`}
        />
      )}
      <div className="flex items-center gap-2 empty:hidden">
        <ChecklistProgress
          description={card.description}
          className="flex-1"
          showCount={false}
        />
        <DueDateBadge dueDate={card.dueDate} />
      </div>
    </div>
  );
}

// Memoized so that re-rendering the parent CardList (e.g. when a card is added
// or removed elsewhere) does not re-render untouched cards and their subtrees.
export const SortableCardItem = memo(SortableCardItemImpl);
