import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useCallback, useMemo, useRef, type CSSProperties } from "react";
import type { Card } from "../board/types";
import type { CardDensity } from "../theme/types";
import { CardControls } from "./CardControls";
import { tc } from "../theme/classNames";
import { useInlineEdit } from "../hooks";

type SortableCardItemProps = Readonly<{
  card: Card;
  onRemove: () => void;
  onUpdate: (title: string) => void;
  canDrag?: boolean;
  density: CardDensity;
  columnId: string;
  index: number;
  isSearchMatch?: boolean;
}>;

export function SortableCardItem({
  card,
  onRemove,
  onUpdate,
  canDrag = true,
  density,
  columnId,
  index,
  isSearchMatch = false,
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
    [transform, transition, isDragging]
  );

  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const cardValue = card.title || "New card";
  const revertCard = useCallback(() => {
    if (textareaRef.current) textareaRef.current.value = cardValue;
  }, [cardValue]);
  const saveCard = useCallback(
    (value: string) => onUpdate(value),
    [onUpdate],
  );
  const { onKeyDown: cardKeyDown, onBlur: cardBlur } = useInlineEdit({
    originalValue: card.title,
    onSave: saveCard,
    onRevert: revertCard,
    multiline: true,
  });

  const rowsForDensity = (() => {
    if (density === "small") return 1;
    if (density === "large") return 3;
    return 2;
  })();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/card relative rounded-md border pr-14 p-2 text-sm ${
        isSearchMatch
          ? "border-blue-500 bg-blue-50 dark:bg-blue-950/30 ring-2 ring-blue-500/50"
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
        onRemove={onRemove}
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
      />

      <textarea
        ref={textareaRef}
        id={`${columnId}-${card.id}-content`}
        aria-label="Card content"
        defaultValue={cardValue}
        className={`${tc.input} w-full resize-y rounded-xs`}
        rows={rowsForDensity}
        onKeyDown={cardKeyDown}
        onBlur={cardBlur}
        data-testid={`card-content-${index}`}
      />
    </div>
  );
}
