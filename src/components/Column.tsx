import { useEffect, useRef, useState } from "react";
import type { Card } from "../board/types";
import { useTheme } from "../theme/useTheme";
import type { CardDensity } from "../theme/types";
import { useBoard } from "../board/useBoard";
// Inline SVGs for action icons so they can inherit currentColor for light/dark themes
import { useDroppable, useDndContext } from "@dnd-kit/core"; // Cleaned up import
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCardItem } from "./SortableCardItem";

type Props = Readonly<{
  id: string;
  title: string;
  cards: Card[];
  canDrag?: boolean;
  dragHandleRef?: (el: HTMLButtonElement | null) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
  overlayMode?: boolean;
}>;

export function Column({
  id,
  title,
  cards,
  canDrag = true,
  dragHandleRef,
  dragHandleProps,
  overlayMode = false,
}: Props) {
  const { addCard, removeColumn, removeCard, updateColumn, updateCard } =
    useBoard();
  const { cardDensity } = useTheme();
  const [tempTitle, setTempTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTempTitle(title);
  }, [title]);
  return (
    <section
      data-column-id={id}
      aria-label={title || "column"}
      className={
        `group relative rounded-lg border border-black/10 dark:border-white/10 p-3 ` +
        (overlayMode
          ? "bg-white/60 dark:bg-black/20 backdrop-blur-md"
          : "bg-surface-light dark:bg-surface-dark")
      }
    >
      {/* Combined drag + delete control */}
      <div className="absolute right-2 top-2 z-1 inline-flex items-center overflow-hidden rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        {canDrag && (
          <button
            type="button"
            ref={dragHandleRef}
            aria-label={`Drag column ${title || "column"}`}
            title="Drag to reorder"
            {...(dragHandleProps as unknown as React.HTMLAttributes<HTMLButtonElement>)}
            className="h-8 w-8 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              className="size-5"
              fill="currentColor"
              aria-hidden
              focusable="false"
            >
              <path d="M360-160q-33 0-56.5-23.5T280-240q0-33 23.5-56.5T360-320q33 0 56.5 23.5T440-240q0 33-23.5 56.5T360-160Zm240 0q-33 0-56.5-23.5T520-240q0-33 23.5-56.5T600-320q33 0 56.5 23.5T680-240q0 33-23.5 56.5T600-160ZM360-400q-33 0-56.5-23.5T280-480q0-33 23.5-56.5T360-560q33 0 56.5 23.5T440-480q0 33-23.5 56.5T360-400Zm240 0q-33 0-56.5-23.5T520-480q0-33 23.5-56.5T600-560q33 0 56.5 23.5T680-480q0 33-23.5 56.5T600-400ZM360-640q-33 0-56.5-23.5T280-720q0-33 23.5-56.5T360-800q33 0 56.5 23.5T440-720q0 33-23.5 56.5T360-640Zm240 0q-33 0-56.5-23.5T520-720q0-33 23.5-56.5T600-800q33 0 56.5 23.5T680-720q0 33-23.5 56.5T600-640Z" />
            </svg>
          </button>
        )}
        {canDrag && (
          <span aria-hidden className="h-6 w-px bg-black/10 dark:bg-white/10" />
        )}
        <button
          type="button"
          onClick={() => removeColumn(id)}
          aria-label={`Remove column ${title || "column"}`}
          title="Remove column"
          className="h-8 w-8 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 -960 960 960"
            className="size-5"
            fill="currentColor"
            aria-hidden
            focusable="false"
          >
            <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
          </svg>
        </button>
      </div>
      <div className="mb-3 mr-16">
        <input
          ref={inputRef}
          type="text"
          aria-label="Column title"
          className="w-full bg-transparent px-0 py-0 text-base font-semibold tracking-tight opacity-80 border-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
          value={tempTitle}
          onFocus={(e) => e.target.select()} // Highlight all text on focus
          onChange={(e) => setTempTitle(e.target.value)}
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
        />
      </div>
      {/* Add card button moved to the top of the column */}
      <div className="mb-3">
        <button
          type="button"
          className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 px-3 py-1.5 text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white"
          onClick={() => addCard(id, "New card")}
          aria-label={`Add card to ${title || "column"}`}
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
    </section>
  );
}

function CardList({
  cards,
  onRemove,
  onUpdate,
  density,
  columnId,
}: Readonly<{
  cards: Card[];
  onRemove: (cardId: string) => void;
  onUpdate: (cardId: string, title: string) => void;
  density: CardDensity;
  columnId: string;
}>) {
  const { columns } = useBoard();
  // Register the column list as a droppable target (works even when empty)
  const { setNodeRef, isOver } = useDroppable({
    id: `col:${columnId}`,
    data: { type: "column-drop", columnId },
  });
  // Also highlight when hovering cards within this column, not just the empty area
  const { over, active } = useDndContext();
  const isCardDrag = active?.data?.current?.type === "card";
  const overColumnId = (
    over?.data?.current as { columnId?: string } | undefined
  )?.columnId;
  const highlight = isCardDrag && (isOver || overColumnId === columnId);

  return (
    <SortableContext
      items={cards.map((c) => c.id)}
      strategy={verticalListSortingStrategy}
    >
      <div
        ref={setNodeRef}
        className={`flex flex-col gap-2 rounded-md transition-colors min-h-16 ${
          highlight
            ? "ring-2 ring-blue-500/60 bg-blue-500/5 dark:bg-blue-400/10"
            : ""
        }`}
        data-testid="card-list"
        data-card-density={density}
        data-droppable-column={columnId}
      >
        {cards.length === 0 ? (
          <p className="text-xs opacity-60 select-none">No cards yet</p>
        ) : (
          cards.map((card) => (
            <SortableCardItem
              key={card.id}
              card={card}
              onRemove={() => onRemove(card.id)}
              onUpdate={(title) => onUpdate(card.id, title)}
              canDrag={cards.length > 1 || columns.length > 1}
              density={density}
              columnId={columnId}
            />
          ))
        )}
      </div>
    </SortableContext>
  );
}
