import { useEffect, useRef, useState } from "react";
import type { Card } from "../board/types";
import { useTheme } from "../theme/useTheme";

import { useBoard } from "../board/useBoard";
import { DragIndicatorIcon } from "./icons/DragIndicatorIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { CardList } from "./CardList";

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
        `group relative rounded-lg border border-black/10 dark:border-white/10 p-3 w-80 ` +
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
            className="h-8 w-8 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:cursor-grab active:cursor-grabbing"
          >
            <DragIndicatorIcon className="size-5" />
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
          className="h-8 w-8 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>
      <div className="mb-3 mr-16">
        <input
          ref={inputRef}
          type="text"
          aria-label="Column title"
          className="w-full bg-transparent px-0 py-0 text-base font-semibold tracking-tight opacity-80 border-0 outline-hidden focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 rounded-xs"
          value={tempTitle}
          onFocus={(e) => e.target.select()} // Highlight all text on focus
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
