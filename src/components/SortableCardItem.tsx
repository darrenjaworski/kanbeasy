import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, type CSSProperties } from "react";
import type { Card } from "../board/types";
import type { CardDensity } from "../theme/types";
import { CardControls } from "./CardControls";

type SortableCardItemProps = Readonly<{
  card: Card;
  onRemove: () => void;
  onUpdate: (title: string) => void;
  canDrag?: boolean;
  density: CardDensity;
  columnId: string;
}>;

export function SortableCardItem({
  card,
  onRemove,
  onUpdate,
  canDrag = true,
  density,
  columnId,
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

  const rowsForDensity = (() => {
    if (density === "small") return 1;
    if (density === "large") return 3;
    return 2;
  })();

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/card relative rounded-md border border-black/10 dark:border-white/10 pr-14 p-2 text-sm bg-white/60 dark:bg-black/20 ${
        isDragging
          ? "backdrop-blur-xs supports-[backdrop-filter]:bg-white/40 supports-[backdrop-filter]:dark:bg-black/30"
          : ""
      }`}
    >
      {/* Combined delete + drag control (horizontal), mirrors column-level style */}
      <CardControls
        canDrag={canDrag}
        cardTitle={card.title}
        onRemove={onRemove}
        setActivatorNodeRef={setActivatorNodeRef}
        attributes={attributes}
        listeners={listeners}
      />

      <textarea
        id={`${columnId}-${card.id}-content`}
        aria-label="Card content"
        defaultValue={card.title || "New card"}
        className="w-full resize-y rounded-xs bg-transparent outline-hidden border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
        rows={rowsForDensity}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (e.currentTarget as HTMLTextAreaElement).blur();
          }
          if (e.key === "Escape") {
            (e.currentTarget as HTMLTextAreaElement).value =
              card.title || "New card";
            (e.currentTarget as HTMLTextAreaElement).blur();
          }
        }}
        onBlur={(e) => {
          const next = e.currentTarget.value.trim();
          if (!next) {
            e.currentTarget.value = card.title || "New card";
            return;
          }
          if (next !== card.title) onUpdate(next);
        }}
      />
    </div>
  );
}
