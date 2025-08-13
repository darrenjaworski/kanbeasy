import { useEffect, useRef, useState, useMemo } from "react";
import { BoardDragOverlay } from "./BoardDragOverlay";
import { BoardScrollGradients } from "./BoardScrollGradients";
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
  type DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  horizontalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { SortableColumnItem } from "./SortableColumnItem";

export function Board() {
  const { columns, addColumn, setColumns } = useBoard();
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const prevLenRef = useRef<number | null>(null);
  const [activeType, setActiveType] = useState<"card" | "column" | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { 
      activationConstraint: { distance: 8 },
    }),
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

  // Helpers to keep drag-end logic readable and within complexity limits
  function reorderColumns(activeId: string, overId: string) {
    const oldIndex = columns.findIndex((c) => c.id === activeId);
    const newIndex = columns.findIndex((c) => c.id === overId);
    if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
    setColumns(arrayMove(columns, oldIndex, newIndex));
  }

  function moveCardWithinOrAcrossColumns(
    fromColId: string,
    toColId: string,
    activeId: string,
    overId: string
  ) {
    const cols = columns.slice();
    const fromIdx = cols.findIndex((c) => c.id === fromColId);
    const toIdx = cols.findIndex((c) => c.id === toColId);
    if (fromIdx === -1 || toIdx === -1) return;

    if (fromIdx === toIdx) {
      const col = cols[fromIdx];
      const oldIndex = col.cards.findIndex((c) => c.id === activeId);
      const newIndex = col.cards.findIndex((c) => c.id === overId);
      if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) return;
      const reordered = arrayMove(col.cards, oldIndex, newIndex);
      const next = cols.slice();
      next[fromIdx] = { ...col, cards: reordered };
      setColumns(next);
      return;
    }

    const fromCol = cols[fromIdx];
    const toCol = cols[toIdx];
    const cardIdx = fromCol.cards.findIndex((c) => c.id === activeId);
    if (cardIdx === -1) return;
    const moved = fromCol.cards[cardIdx];
    const nextFromCards = fromCol.cards.slice();
    nextFromCards.splice(cardIdx, 1);
    const overIdx = toCol.cards.findIndex((c) => c.id === overId);
    const insertAt = overIdx === -1 ? toCol.cards.length : overIdx;
    const nextToCards = toCol.cards.slice();
    nextToCards.splice(insertAt, 0, moved);
    const next = cols.slice();
    next[fromIdx] = { ...fromCol, cards: nextFromCards };
    next[toIdx] = { ...toCol, cards: nextToCards };
    setColumns(next);
  }

  function dropCardOnColumnArea(
    fromColId: string,
    toColId: string,
    activeId: string
  ) {
    const cols = columns.slice();
    const fromIdx = cols.findIndex((c) => c.id === fromColId);
    const toIdx = cols.findIndex((c) => c.id === toColId);
    if (fromIdx === -1 || toIdx === -1) return;

    if (fromIdx === toIdx) {
      const col = cols[fromIdx];
      const oldIndex = col.cards.findIndex((c) => c.id === activeId);
      if (oldIndex === -1) return;
      const reordered = arrayMove(col.cards, oldIndex, col.cards.length - 1);
      const next = cols.slice();
      next[fromIdx] = { ...col, cards: reordered };
      setColumns(next);
      return;
    }

    const fromCol = cols[fromIdx];
    const toCol = cols[toIdx];
    const cardIdx = fromCol.cards.findIndex((c) => c.id === activeId);
    if (cardIdx === -1) return;
    const moved = fromCol.cards[cardIdx];
    const nextFromCards = fromCol.cards.slice();
    nextFromCards.splice(cardIdx, 1);
    const nextToCards = toCol.cards.slice();
    nextToCards.unshift(moved);
    const next = cols.slice();
    next[fromIdx] = { ...fromCol, cards: nextFromCards };
    next[toIdx] = { ...toCol, cards: nextToCards };
    setColumns(next);
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over) return;
    const aType = active.data.current?.type as string | undefined;
    const oType = over.data.current?.type as string | undefined;

    if (aType === "column" && oType === "column") {
      reorderColumns(String(active.id), String(over.id));
      return;
    }

    if (aType === "card" && oType === "card") {
      const fromColId = active.data.current?.columnId as string;
      const toColId = over.data.current?.columnId as string;
      moveCardWithinOrAcrossColumns(
        fromColId,
        toColId,
        String(active.id),
        String(over.id)
      );
      return;
    }

    if (aType === "card" && oType === "column-drop") {
      const fromColId = active.data.current?.columnId as string;
      const toColId = over.data.current?.columnId as string;
      if (!toColId) return;
      dropCardOnColumnArea(fromColId, toColId, String(active.id));
    }
  }

  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const type =
      (active.data.current?.type as "card" | "column" | undefined) ?? null;
    setActiveType(type ?? null);
    setActiveId(String(active.id));
  }

  function handleDragCancel() {
    setActiveType(null);
    setActiveId(null);
  }

  // Resolve the active card data for DragOverlay rendering
  const activeCard = useMemo(() => {
    if (activeType !== "card" || !activeId) return null;
    for (const col of columns) {
      const found = col.cards.find((c) => c.id === activeId);
      if (found) return found;
    }
    return null;
  }, [activeType, activeId, columns]);

  return (
    <main className="mx-auto p-6">
      {columns.length === 0 ? (
        <AddColumn handleOnClick={() => addColumn("New Column")} />
      ) : (
        <>
          <div ref={scrollerRef} className="overflow-x-auto w-full">
            <DndContext
              sensors={sensors}
              collisionDetection={closestCorners}
              modifiers={
                activeType === "column" ? [restrictToHorizontalAxis] : undefined
              }
              onDragStart={handleDragStart}
              onDragEnd={(e) => {
                handleDragEnd(e);
                setActiveType(null);
                setActiveId(null);
              }}
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
                      canDrag={columns.length > 1}
                    />
                  ))}
                  {/* Add Column tile at the end */}
                  <AddColumn handleOnClick={() => addColumn("New Column")} />
                </div>
              </SortableContext>
              <BoardDragOverlay
                activeType={activeType}
                activeCard={activeCard}
              />
            </DndContext>
          </div>
          <BoardScrollGradients
            canScrollLeft={canScrollLeft}
            canScrollRight={canScrollRight}
          />
        </>
      )}
    </main>
  );
}
