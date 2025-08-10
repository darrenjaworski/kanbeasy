import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useMemo, type CSSProperties } from "react";
import type { Card } from "../board/types";
import type { CardDensity } from "../theme/types";

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
          ? "backdrop-blur-sm supports-[backdrop-filter]:bg-white/40 supports-[backdrop-filter]:dark:bg-black/30"
          : ""
      }`}
    >
      {/* Combined delete + drag control (horizontal), mirrors column-level style */}
      <div className="absolute right-1 top-1 z-10 inline-flex items-center overflow-hidden rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100">
        {canDrag && (
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...(attributes as unknown as React.HTMLAttributes<HTMLButtonElement>)}
            {...(listeners as unknown as React.HTMLAttributes<HTMLButtonElement>)}
            aria-label={`Drag card ${card.title || "Untitled"}`}
            title="Drag to reorder"
            className="h-6 w-6 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="http://www.w3.org/2000/svg"
              className="size-4"
              fill="currentColor"
              aria-hidden
              focusable="false"
            >
              <path d="M120-240v-80h240v80H120Zm0-200v-80h480v80H120Zm0-200v-80h720v80H120Z" />
            </svg>
          </button>
        )}
        {canDrag && (
          <span aria-hidden className="h-6 w-px bg-black/10 dark:bg-white/10" />
        )}
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove card ${card.title || "Untitled"}`}
          title="Remove card"
          className="h-6 w-6 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="http://www.w3.org/2000/svg"
            className="size-4"
            fill="currentColor"
            aria-hidden
            focusable="false"
          >
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
          </svg>
        </button>
      </div>

      <textarea
        aria-label="Card content"
        defaultValue={card.title || "New card"}
        className="w-full resize-y rounded-sm bg-transparent outline-none border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
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
