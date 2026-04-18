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
  horizontalListSortingStrategy,
  sortableKeyboardCoordinates,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import type { Column } from "../../board/types";
import type { findCardInColumns } from "../../board/dragUtils";
import { AddColumn } from "./AddColumn";
import { BoardDragOverlay } from "./BoardDragOverlay";
import { BoardScrollGradients } from "./BoardScrollGradients";
import { SortableColumnItem } from "./SortableColumnItem";
import { useBoardScroll } from "./useBoardScroll";

type Props = Readonly<{
  columns: Column[];
  columnOrderLocked: boolean;
  activeType: "card" | "column" | null;
  activeCard: ReturnType<typeof findCardInColumns>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
  onAddColumn: () => void;
  onOpenDetail: (cardId: string) => void;
}>;

export function DesktopBoard({
  columns,
  columnOrderLocked,
  activeType,
  activeCard,
  handleDragStart,
  handleDragEnd,
  handleDragCancel,
  onAddColumn,
  onOpenDetail,
}: Props) {
  const { scrollerRef, canScrollLeft, canScrollRight } = useBoardScroll(
    columns.length,
  );

  const sensors = useSensors(
    useSensor(MouseSensor, { activationConstraint: { distance: 5 } }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  return (
    <div className="relative">
      <div ref={scrollerRef} className="overflow-x-auto w-full">
        <DndContext
          sensors={sensors}
          collisionDetection={closestCorners}
          modifiers={
            activeType === "column" ? [restrictToHorizontalAxis] : undefined
          }
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext
            items={columns.map((c) => c.id)}
            strategy={horizontalListSortingStrategy}
          >
            <div className="flex gap-4 pb-1 items-stretch">
              {columns.map((c, index) => (
                <SortableColumnItem
                  index={index}
                  key={c.id}
                  id={c.id}
                  title={c.title}
                  cards={c.cards}
                  canDrag={columns.length > 1 && !columnOrderLocked}
                  disabled={columnOrderLocked}
                  columnCount={columns.length}
                  onOpenDetail={onOpenDetail}
                />
              ))}
              <AddColumn handleOnClick={onAddColumn} />
            </div>
          </SortableContext>
          <BoardDragOverlay activeType={activeType} activeCard={activeCard} />
        </DndContext>
      </div>
      <BoardScrollGradients
        canScrollLeft={canScrollLeft}
        canScrollRight={canScrollRight}
      />
    </div>
  );
}
