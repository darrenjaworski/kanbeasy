import type { Card } from "../board/types";
import { useBoard } from "../board/useBoard";

type Props = Readonly<{
  id: string;
  title: string;
  cards: Card[];
}>;

export function Column({ id, title, cards }: Props) {
  const { addCard, removeColumn } = useBoard();
  const headingId = `col-${id}-title`;
  return (
    <section
      aria-labelledby={headingId}
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
      <h2
        id={headingId}
        className="text-sm font-semibold tracking-tight mb-3 opacity-80"
      >
        {title}
      </h2>
      <div className="flex flex-col gap-2 min-h-28">
        {cards.length === 0 ? (
          <p className="text-xs opacity-60">No cards yet</p>
        ) : (
          cards.map((card) => (
            <div
              key={card.id}
              className="rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 px-2 py-1 text-sm"
            >
              {card.title || "Untitled"}
            </div>
          ))
        )}
      </div>
      <div className="mt-3">
        <button
          type="button"
          className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 px-3 py-1.5 text-sm hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
          onClick={() => addCard(id, "New card")}
          aria-label={`Add card to ${title || "column"}`}
        >
          Add card
        </button>
      </div>
    </section>
  );
}
