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
  closestCorners,
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
  } = useSortable({ id, data: { type: "column" } });
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
  const { columns, addColumn, setColumns } = useBoard();
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
    if (!over) return;
    const activeType = active.data.current?.type as string | undefined;
    const overType = over.data.current?.type as string | undefined;

    // Column reordering
    if (activeType === "column" && overType === "column") {
      const oldIndex = columns.findIndex((c) => c.id === String(active.id));
      const newIndex = columns.findIndex((c) => c.id === String(over.id));
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const next = arrayMove(columns, oldIndex, newIndex);
      setColumns(next);
      return;
    }

    // Card sorting within same column via over card
    if (activeType === "card" && overType === "card") {
      const fromColId = active.data.current?.columnId as string;
      const toColId = over.data.current?.columnId as string;
      const activeId = String(active.id);
      const overId = String(over.id);
      const cols = columns.slice();
      const fromIdx = cols.findIndex((c) => c.id === fromColId);
      const toIdx = cols.findIndex((c) => c.id === toColId);
      if (fromIdx === -1 || toIdx === -1) return;
      // Same column: just reorder within the array
      if (fromIdx === toIdx) {
        const col = cols[fromIdx];
        const oldIndex = col.cards.findIndex((c) => c.id === activeId);
        const newIndex = col.cards.findIndex((c) => c.id === overId);
        if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
        const reordered = arrayMove(col.cards, oldIndex, newIndex);
        const next = cols.slice();
        next[fromIdx] = { ...col, cards: reordered };
        setColumns(next);
      } else {
        const fromCol = cols[fromIdx];
        const toCol = cols[toIdx];
        const cardIdx = fromCol.cards.findIndex((c) => c.id === activeId);
        if (cardIdx === -1) return;
        const moved = fromCol.cards[cardIdx];
        // remove from source
        const nextFromCards = fromCol.cards.slice();
        nextFromCards.splice(cardIdx, 1);
        // compute insertion index in target based on over card index
        const overIdx = toCol.cards.findIndex((c) => c.id === overId);
        const insertAt = overIdx === -1 ? toCol.cards.length : overIdx;
        const nextToCards = toCol.cards.slice();
        nextToCards.splice(insertAt, 0, moved);
        const next = cols.slice();
        next[fromIdx] = { ...fromCol, cards: nextFromCards };
        next[toIdx] = { ...toCol, cards: nextToCards };
        setColumns(next);
      }
      return;
    }

    // Card dropped over empty column area
    if (activeType === "card" && overType === "column-drop") {
      const fromColId = active.data.current?.columnId as string;
      const toColId = over.data.current?.columnId as string;
      const activeId = String(active.id);
      if (!toColId) return;
      const cols = columns.slice();
      const fromIdx = cols.findIndex((c) => c.id === fromColId);
      const toIdx = cols.findIndex((c) => c.id === toColId);
      if (fromIdx === -1 || toIdx === -1) return;
      // Same column: move item to the end when dropping on column area
      if (fromIdx === toIdx) {
        const col = cols[fromIdx];
        const oldIndex = col.cards.findIndex((c) => c.id === activeId);
        if (oldIndex === -1) return;
        const reordered = arrayMove(col.cards, oldIndex, col.cards.length - 1);
        const next = cols.slice();
        next[fromIdx] = { ...col, cards: reordered };
        setColumns(next);
      } else {
        const fromCol = cols[fromIdx];
        const toCol = cols[toIdx];
        const cardIdx = fromCol.cards.findIndex((c) => c.id === activeId);
        if (cardIdx === -1) return;
        const moved = fromCol.cards[cardIdx];
        const nextFromCards = fromCol.cards.slice();
        nextFromCards.splice(cardIdx, 1);
        const nextToCards = toCol.cards.slice();
        nextToCards.unshift(moved); // add to top of target column
        const next = cols.slice();
        next[fromIdx] = { ...fromCol, cards: nextFromCards };
        next[toIdx] = { ...toCol, cards: nextToCards };
        setColumns(next);
      }
      return;
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
              collisionDetection={closestCorners}
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
