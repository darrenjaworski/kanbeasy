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
  type KeyboardCoordinateGetter,
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
  canDrag,
}: Readonly<{
  id: string;
  title: string;
  cards: import("../board/types").Card[];
  canDrag: boolean;
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
        canDrag={canDrag}
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
  const { columns, addColumn, setColumns, moveCardBetweenColumns } = useBoard();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const prevLenRef = useRef<number | null>(null);

  // Get only column IDs for the Board-level SortableContext
  const columnIds = useMemo(() => {
    return columns.map((c) => c.id);
  }, [columns]);

  // Custom keyboard coordinate getter that supports cross-column navigation
  const customKeyboardCoordinates: KeyboardCoordinateGetter = (
    event,
    { context, active, currentCoordinates }
  ) => {
    // For cards, enable cross-column navigation
    const activeCard = columns
      .flatMap((c) => c.cards.map((card) => ({ ...card, columnId: c.id })))
      .find((card) => card.id === String(active));

    if (activeCard) {
      const { code } = event;
      
      if (code === "ArrowRight") {
        // Move to next column
        const currentColumnIndex = columns.findIndex(c => c.id === activeCard.columnId);
        const nextColumnIndex = currentColumnIndex + 1;
        
        if (nextColumnIndex < columns.length) {
          const nextColumn = columns[nextColumnIndex];
          // Return the column element as the target
          const columnElement = document.querySelector(`[data-column-id="${nextColumn.id}"]`);
          if (columnElement) {
            const rect = columnElement.getBoundingClientRect();
            return {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            };
          }
        }
      }
      
      if (code === "ArrowLeft") {
        // Move to previous column
        const currentColumnIndex = columns.findIndex(c => c.id === activeCard.columnId);
        const prevColumnIndex = currentColumnIndex - 1;
        
        if (prevColumnIndex >= 0) {
          const prevColumn = columns[prevColumnIndex];
          // Return the column element as the target
          const columnElement = document.querySelector(`[data-column-id="${prevColumn.id}"]`);
          if (columnElement) {
            const rect = columnElement.getBoundingClientRect();
            return {
              x: rect.left + rect.width / 2,
              y: rect.top + rect.height / 2,
            };
          }
        }
      }
    }

    // Fall back to default keyboard coordinates for other cases
    return sortableKeyboardCoordinates(event, { context, active, currentCoordinates });
  };

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: customKeyboardCoordinates })
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

  function handleDragStart() {
    // Currently not used, but keeping for future drag overlay functionality
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    
    if (!over || active.id === over.id) return;

    const activeId = String(active.id);
    const overId = String(over.id);

    // Check if dragging a column
    const isActiveColumn = columns.some((c) => c.id === activeId);
    const isOverColumn = columns.some((c) => c.id === overId);

    if (isActiveColumn && isOverColumn) {
      // Column reordering
      const oldIndex = columns.findIndex((c) => c.id === activeId);
      const newIndex = columns.findIndex((c) => c.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const next = arrayMove(columns, oldIndex, newIndex);
      setColumns(next);
      return;
    }

    // Check if dragging a card for cross-column moves only
    const activeCard = columns
      .flatMap((c) => c.cards.map((card) => ({ ...card, columnId: c.id })))
      .find((card) => card.id === activeId);

    if (!activeCard) return;

    // Only handle cross-column moves at Board level
    // Within-column moves are handled by Column's DndContext
    if (isOverColumn && activeCard.columnId !== overId) {
      // Cross-column move - drop at the end of the target column
      const targetColumn = columns.find((c) => c.id === overId);
      if (targetColumn) {
        moveCardBetweenColumns(activeId, activeCard.columnId, overId, targetColumn.cards.length);
      }
    }
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
              onDragStart={handleDragStart}
              onDragEnd={handleDragEnd}
            >
              <SortableContext
                items={columnIds}
                strategy={horizontalListSortingStrategy}
              >
                <div className="flex gap-4 pb-1 items-stretch">
                  {columns.map((c) => (
                    <SortableColumnItem
                      key={c.id}
                      id={c.id}
                      title={c.title}
                      cards={c.cards}
                      canDrag={columns.length > 1}
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
