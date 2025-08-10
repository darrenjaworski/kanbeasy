import { useEffect, useRef, useState } from "react";
import type { Card } from "../board/types";
import { useBoard } from "../board/useBoard";

type Props = Readonly<{
  id: string;
  title: string;
  cards: Card[];
}>;

export function Column({ id, title, cards }: Props) {
  const { addCard, removeColumn, removeCard, updateColumn } = useBoard();
  const [tempTitle, setTempTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTempTitle(title);
  }, [title]);
  return (
    <section
      aria-label={title || "column"}
      className="group relative rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark p-3"
    >
      {/* Remove column button (appears on hover/focus) */}
      <button
        type="button"
        onClick={() => removeColumn(id)}
        aria-label={`Remove column ${title || "column"}`}
        title="Remove column"
        className="absolute right-2 top-2 z-10 inline-flex h-8 w-8 items-center justify-center rounded-full text-base opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100 hover:opacity-100 focus:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
      >
        ×
      </button>
      <div className="mb-3">
        <input
          ref={inputRef}
          type="text"
          aria-label="Column title"
          className="w-full bg-transparent px-0 py-0 text-base font-semibold tracking-tight opacity-80 border-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
          value={tempTitle}
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
          className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 px-3 py-1.5 text-sm hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
          onClick={() => addCard(id, "New card")}
          aria-label={`Add card to ${title || "column"}`}
        >
          Add card
        </button>
      </div>
      <div className="flex flex-col gap-2 min-h-28">
        {cards.length === 0 ? (
          <p className="text-xs opacity-60">No cards yet</p>
        ) : (
          cards.map((card) => (
            <div
              key={card.id}
              className="group/card relative rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 pl-2 pr-7 py-1 text-sm"
            >
              <span>{card.title || "Untitled"}</span>
              <button
                type="button"
                onClick={() => removeCard(id, card.id)}
                aria-label={`Remove card ${card.title || "Untitled"}`}
                title="Remove card"
                className="absolute right-1 top-1 inline-flex h-6 w-6 items-center justify-center rounded-full text-sm opacity-0 transition-opacity group-hover/card:opacity-100 focus:opacity-100 hover:opacity-100 hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
              >
                ×
              </button>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
