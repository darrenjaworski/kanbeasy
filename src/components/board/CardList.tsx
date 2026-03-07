import { useBoard } from "../../board/useBoard";
import { tc } from "../../theme/classNames";
import { useDroppable, useDndContext } from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { SortableCardItem } from "./SortableCardItem";
import type { Card, CardUpdates } from "../../board/types";
import type { CardDensity } from "../../theme/types";

export function CardList({
  cards,
  onCopy,
  onArchive,
  onUpdate,
  onOpenDetail,
  density,
  columnId,
  autoFocusCardId,
  onAutoFocused,
}: Readonly<{
  cards: Card[];
  onCopy: (cardId: string) => void;
  onArchive: (cardId: string) => void;
  onUpdate: (cardId: string, updates: CardUpdates) => void;
  onOpenDetail: (cardId: string) => void;
  density: CardDensity;
  columnId: string;
  autoFocusCardId?: string | null;
  onAutoFocused?: () => void;
}>) {
  const { columns, matchingCardIds } = useBoard();
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
          highlight ? tc.searchHighlight : ""
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
              onCopy={() => onCopy(card.id)}
              onArchive={() => onArchive(card.id)}
              onUpdate={(updates) => onUpdate(card.id, updates)}
              onOpenDetail={() => onOpenDetail(card.id)}
              canDrag={cards.length > 1 || columns.length > 1}
              density={density}
              columnId={columnId}
              isSearchMatch={matchingCardIds.has(card.id)}
              // eslint-disable-next-line jsx-a11y/no-autofocus -- intentional: auto-select new card title for immediate editing
              autoFocus={card.id === autoFocusCardId}
              onAutoFocused={onAutoFocused}
            />
          ))
        )}
      </div>
    </SortableContext>
  );
}
