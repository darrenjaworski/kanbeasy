import { useEffect, useRef } from "react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import {
  DndContext,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  closestCorners,
  useSensor,
  useSensors,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import type { Column } from "../../board/types";
import type { findCardInColumns } from "../../board/dragUtils";
import { useSwipeNavigation } from "../../hooks";
import { BoardDragOverlay } from "./BoardDragOverlay";
import { Column as BoardColumn } from "./Column";

type Props = Readonly<{
  columns: Column[];
  activeColumnIndex: number;
  onActiveColumnIndexChange: (index: number) => void;
  activeType: "card" | "column" | null;
  activeCard: ReturnType<typeof findCardInColumns>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
  onOpenDetail: (cardId: string) => void;
}>;

export function MobileBoard({
  columns,
  activeColumnIndex,
  onActiveColumnIndexChange,
  activeType,
  activeCard,
  handleDragStart,
  handleDragEnd,
  handleDragCancel,
  onOpenDetail,
}: Props) {
  const prevCountRef = useRef<number | null>(null);

  // Jump to the newly added column
  useEffect(() => {
    const prev = prevCountRef.current;
    if (prev !== null && columns.length > prev) {
      onActiveColumnIndexChange(columns.length - 1);
    }
    prevCountRef.current = columns.length;
  }, [columns.length, onActiveColumnIndexChange]);

  const handleSwipeLeft = () => {
    onActiveColumnIndexChange(
      Math.min(activeColumnIndex + 1, columns.length - 1),
    );
  };
  const handleSwipeRight = () => {
    onActiveColumnIndexChange(Math.max(activeColumnIndex - 1, 0));
  };

  const { onTouchStart, onTouchEnd } = useSwipeNavigation({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    enabled: !activeType,
  });

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeColumn = columns[activeColumnIndex] ?? null;
  if (!activeColumn) return null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      onDragCancel={handleDragCancel}
    >
      <SortableContext
        items={activeColumn.cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div
          className="w-full"
          onTouchStart={onTouchStart}
          onTouchEnd={onTouchEnd}
        >
          <BoardColumn
            id={activeColumn.id}
            title={activeColumn.title}
            cards={activeColumn.cards}
            canDrag={false}
            index={activeColumnIndex}
            columnCount={columns.length}
            onOpenDetail={onOpenDetail}
            fullWidth
          />
        </div>
      </SortableContext>
      <BoardDragOverlay activeType={activeType} activeCard={activeCard} />
    </DndContext>
  );
}
