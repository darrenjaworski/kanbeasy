import type { Card } from "../board/types";
import { useBoard } from "../board/useBoard";

type Props = Readonly<{
  id: string;
  title: string;
  cards: Card[];
}>;

export function Column({ id, title, cards }: Props) {
  const { addCard } = useBoard();
  const headingId = `col-${id}-title`;
  return (
    <section
      aria-labelledby={headingId}
      className="rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark p-3"
    >
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
