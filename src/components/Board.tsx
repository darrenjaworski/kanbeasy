import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ButtonHTMLAttributes,
} from "react";
import { Column } from "./Column";
import { useBoard } from "../board/useBoard";
import { AddColumn } from "./AddColumn";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
  useSortable,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

function SortableColumnItem({
  id,
  title,
  cards,
}: Readonly<{
  id: string;
  title: string;
  cards: import("../board/types").Card[];
}>) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id });
  const style: CSSProperties = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      // keep item above neighbors while dragging
      zIndex: isDragging ? 10 : undefined,
    }),
    [transform, transition, isDragging]
  );
  return (
    <div ref={setNodeRef} style={style} className="w-80 shrink-0">
      <Column
        id={id}
        title={title}
        cards={cards}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{
          ...(attributes as unknown as ButtonHTMLAttributes<HTMLButtonElement>),
          ...(listeners as unknown as ButtonHTMLAttributes<HTMLButtonElement>),
        }}
      />
    </div>
  );
}

export function Board() {
  const { columns, addColumn, setColumns, moveCard } = useBoard();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const prevLenRef = useRef<number | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) return;
    const update = () => {
      const { scrollLeft, clientWidth, scrollWidth } = el;
      setCanScrollRight(scrollLeft + clientWidth < scrollWidth - 1);
      setCanScrollLeft(scrollLeft > 0);
    };
    update();
    el.addEventListener("scroll", update, { passive: true });
    const ro = new ResizeObserver(update);
    ro.observe(el);
    // observe content too
    if (el.firstElementChild) {
      ro.observe(el.firstElementChild);
    }
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [columns.length]);

  // Scroll to the far right when a new column is added (but skip initial mount)
  useEffect(() => {
    const el = scrollerRef.current;
    const prevLen = prevLenRef.current;
    if (!el) {
      prevLenRef.current = columns.length;
      return;
    }
    if (prevLen !== null && columns.length > prevLen) {
      // Wait a frame to ensure the new column is laid out, then scroll smoothly
      requestAnimationFrame(() => {
        const maxLeft = el.scrollWidth;
        // Prefer smooth scroll when available (browsers); fallback for jsdom
        type MaybeScrollTo = { scrollTo?: (opts: ScrollToOptions) => void };
        if (typeof (el as unknown as MaybeScrollTo).scrollTo === "function") {
          (el as unknown as MaybeScrollTo).scrollTo!({
            left: maxLeft,
            behavior: "smooth",
          });
        } else {
          el.scrollLeft = maxLeft;
        }
      });
    }
    prevLenRef.current = columns.length;
  }, [columns.length]);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    
    const activeId = String(active.id);
    const overId = String(over.id);
    
    // Check if we're dragging a column (original functionality)
    const isColumnDrag = columns.some(c => c.id === activeId) && columns.some(c => c.id === overId);
    
    if (isColumnDrag) {
      // Handle column reordering (original logic)
      const oldIndex = columns.findIndex((c) => c.id === activeId);
      const newIndex = columns.findIndex((c) => c.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const next = arrayMove(columns, oldIndex, newIndex);
      setColumns(next);
      return;
    }
    
    // Handle cross-column card dragging
    const activeCard = findCardAndColumn(activeId);
    if (!activeCard) return;
    
    const { columnId: fromColumnId } = activeCard;
    
    // Check if we're dropping on a column droppable area
    if (overId.startsWith('column-droppable-')) {
      const targetColumnId = overId.replace('column-droppable-', '');
      const targetColumn = columns.find(c => c.id === targetColumnId);
      if (targetColumn && fromColumnId !== targetColumnId) {
        // Move to the end of the target column
        moveCard(activeId, fromColumnId, targetColumnId);
      }
      return;
    }
    
    // Check if we're dropping on another card for cross-column movement
    const overCard = findCardAndColumn(overId);
    if (overCard) {
      const { columnId: toColumnId } = overCard;
      
      if (fromColumnId !== toColumnId) {
        // Cross-column card movement at specific position
        const toColumn = columns.find(c => c.id === toColumnId);
        if (toColumn) {
          const overCardIndex = toColumn.cards.findIndex(c => c.id === overId);
          moveCard(activeId, fromColumnId, toColumnId, overCardIndex);
        }
      }
      // Note: within-column reordering is handled by the Column component's own DndContext
      return;
    }
  }
  
  function findCardAndColumn(cardId: string): { card: import("../board/types").Card; columnId: string } | null {
    for (const column of columns) {
      const card = column.cards.find(c => c.id === cardId);
      if (card) {
        return { card, columnId: column.id };
      }
    }
    return null;
  }

  return (
    <div>
      {columns.length === 0 ? (
        <div>
          <AddColumn handleOnClick={() => addColumn("New Column")} />
        </div>
      ) : (
        <div className="relative">
          <div ref={scrollerRef} className="overflow-x-auto w-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columns.map((c) => c.id)}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-4 pb-1 items-stretch">
                  {columns.map((c) => (
                    <SortableColumnItem
                      key={c.id}
                      id={c.id}
                      title={c.title}
                      cards={c.cards}
                    />
                  ))}
                  {/* Add Column tile at the end */}
                  <AddColumn handleOnClick={() => addColumn("New Column")} />
                </div>
              </SortableContext>
            </DndContext>
          </div>
          {canScrollLeft && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-bg-light/90 to-transparent dark:from-bg-dark/90"
            />
          )}
          {canScrollRight && (
            <div
              aria-hidden
              className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-bg-light/90 to-transparent dark:from-bg-dark/90"
            />
          )}
        </div>
      )}
    </div>
  );
}
