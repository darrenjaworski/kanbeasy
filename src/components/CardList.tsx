import { useBoard } from "../board/useBoard";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCardItem } from "./SortableCardItem";
import type { Card } from "../board/types";
import type { CardDensity } from "../theme/types";

export function CardList({
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
          cards.map((card, index) => (
            <SortableCardItem
              index={index}
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
