import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  type CSSProperties,
} from "react";
import type { Card, CardUpdates } from "../../board/types";
import type { CardDensity } from "../../theme/types";
import { CardControls } from "./CardControls";
import { tc } from "../../theme/classNames";
import { useInlineEdit } from "../../hooks";

type SortableCardItemProps = Readonly<{
  card: Card;
  onCopy: () => void;
  onRemove: () => void;
  onUpdate: (updates: CardUpdates) => void;
  onOpenDetail: () => void;
  canDrag?: boolean;
  density: CardDensity;
  columnId: string;
  index: number;
  isSearchMatch?: boolean;
  autoFocus?: boolean;
  onAutoFocused?: () => void;
}>;

export function SortableCardItem({
  card,
  onCopy,
  onRemove,
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

  const revertCard = useCallback(() => {
    if (textareaRef.current) textareaRef.current.value = cardValue;
  }, [cardValue]);
  const saveCard = useCallback(
    (value: string) => onUpdate({ title: value }),
    [onUpdate],
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

  const rowsForDensity = (() => {
    if (density === "small") return 1;
    if (density === "large") return 3;
    return 2;
  })();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/card relative rounded-md border p-2 text-sm ${
        isSearchMatch
          ? "border-accent bg-accent/5 dark:bg-accent/10 ring-2 ring-accent/50"
          : `${tc.border} ${tc.glass}`
      } ${
        isDragging
          ? "backdrop-blur-xs supports-[backdrop-filter]:bg-white/40 supports-[backdrop-filter]:dark:bg-black/30"
          : ""
      }`}
      data-testid={`card-${index}`}
    >
      <CardControls
        index={index}
        canDrag={canDrag}
        cardTitle={card.title}
        onCopy={onCopy}
        onRemove={onRemove}
        onOpenDetail={onOpenDetail}
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
      />

      <textarea
        ref={textareaRef}
        id={`${columnId}-${card.id}-content`}
        aria-label="Card content"
        defaultValue={cardValue}
        className={`${tc.input} w-full resize-none hover:resize-y focus:resize-y rounded-xs`}
        rows={rowsForDensity}
        onKeyDown={cardKeyDown}
        onBlur={cardBlur}
        data-testid={`card-content-${index}`}
      />
    </div>
  );
}
