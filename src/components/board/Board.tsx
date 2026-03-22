import { useCallback, useEffect, useRef, useState } from "react";
import { BoardColumnTabs } from "./BoardColumnTabs";
import { BoardDragOverlay } from "./BoardDragOverlay";
import { BoardScrollGradients } from "./BoardScrollGradients";
import { CardDetailModal } from "./CardDetailModal";
import { Column } from "./Column";
import { useBoard } from "../../board/useBoard";
import { useTheme } from "../../theme/useTheme";
import { useBoardDragAndDrop } from "../../board/useBoardDragAndDrop";
import { useIsMobile, useSwipeNavigation } from "../../hooks";
import { findCardWithColumn } from "../../board/dragUtils";
import { AddColumn } from "./AddColumn";
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
  horizontalListSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { restrictToHorizontalAxis } from "@dnd-kit/modifiers";
import { SortableColumnItem } from "./SortableColumnItem";

export function Board() {
  const { columns, addColumn, setColumns, updateCard, moveCard, archiveCard } =
    useBoard();
  const { cardDensity, cardTypes, columnOrderLocked } = useTheme();
  const isMobile = useIsMobile();

  // Desktop scroll state
  const scrollerRef = useRef<HTMLDivElement | null>(null);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [canScrollLeft, setCanScrollLeft] = useState(false);

  // Mobile: active column tab
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);

  // Clamp active index when a column is deleted
  useEffect(() => {
    if (columns.length > 0 && activeColumnIndex >= columns.length) {
      setActiveColumnIndex(columns.length - 1);
    }
  }, [columns.length, activeColumnIndex]);

  const prevLenRef = useRef<number | null>(null);

  // Desktop: scroll to far right when a new column is added
  useEffect(() => {
    const el = scrollerRef.current;
    if (!el) {
      prevLenRef.current = columns.length;
      return;
    }
    const prevLen = prevLenRef.current;
    if (prevLen !== null && columns.length > prevLen) {
      requestAnimationFrame(() => {
        type MaybeScrollTo = { scrollTo?: (opts: ScrollToOptions) => void };
        if (typeof (el as unknown as MaybeScrollTo).scrollTo === "function") {
          (el as unknown as MaybeScrollTo).scrollTo!({
            left: el.scrollWidth,
            behavior: "smooth",
          });
        } else {
          el.scrollLeft = el.scrollWidth;
        }
      });
    }
    prevLenRef.current = columns.length;
  }, [columns.length]);

  // Mobile: jump to new column when one is added
  useEffect(() => {
    if (!isMobile) return;
    const prev = prevLenRef.current;
    if (prev !== null && columns.length > prev) {
      setActiveColumnIndex(columns.length - 1);
    }
  }, [isMobile, columns.length]);

  // Desktop scroll gradient tracking
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
    if (el.firstElementChild) ro.observe(el.firstElementChild);
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      ro.disconnect();
      window.removeEventListener("resize", update);
    };
  }, [columns.length]);

  // Card detail modal — lifted so it survives cross-column moves
  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const handleOpenDetail = useCallback((cardId: string) => {
    setDetailCardId(cardId);
  }, []);
  const detailCard = detailCardId
    ? findCardWithColumn(columns, detailCardId)
    : null;

  const {
    activeType,
    activeCard,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  } = useBoardDragAndDrop({ columns, setColumns });

  const sensors = useSensors(
    useSensor(MouseSensor, {
      activationConstraint: { distance: 5 },
    }),
    useSensor(TouchSensor, {
      activationConstraint: { delay: 200, tolerance: 5 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    }),
  );

  const activeColumn =
    isMobile && columns.length > 0 ? columns[activeColumnIndex] : null;

  const handleSwipeLeft = useCallback(() => {
    setActiveColumnIndex((i) => Math.min(i + 1, columns.length - 1));
  }, [columns.length]);

  const handleSwipeRight = useCallback(() => {
    setActiveColumnIndex((i) => Math.max(i - 1, 0));
  }, []);

  const { onTouchStart, onTouchEnd } = useSwipeNavigation({
    onSwipeLeft: handleSwipeLeft,
    onSwipeRight: handleSwipeRight,
    enabled: isMobile && !activeType,
  });

  return (
    <>
      {isMobile && columns.length > 0 && (
        <BoardColumnTabs
          columns={columns}
          activeIndex={activeColumnIndex}
          onTabClick={setActiveColumnIndex}
          onAddColumn={() => addColumn("New Column")}
        />
      )}
      <main className={`mx-auto ${isMobile ? "p-4" : "p-6"}`}>
        {columns.length === 0 ? (
          <AddColumn handleOnClick={() => addColumn("New Column")} />
        ) : isMobile ? (
          /* ── Mobile: single full-width column ── */
          <>
            {activeColumn && (
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
                    <Column
                      id={activeColumn.id}
                      title={activeColumn.title}
                      cards={activeColumn.cards}
                      canDrag={false}
                      index={activeColumnIndex}
                      columnCount={columns.length}
                      onOpenDetail={handleOpenDetail}
                      fullWidth
                    />
                  </div>
                </SortableContext>
                <BoardDragOverlay
                  activeType={activeType}
                  activeCard={activeCard}
                />
              </DndContext>
            )}
          </>
        ) : (
          /* ── Desktop: horizontal scroll ── */
          <div className="relative">
            <div ref={scrollerRef} className="overflow-x-auto w-full">
              <DndContext
                sensors={sensors}
                collisionDetection={closestCorners}
                modifiers={
                  activeType === "column"
                    ? [restrictToHorizontalAxis]
                    : undefined
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
                        onOpenDetail={handleOpenDetail}
                      />
                    ))}
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
          </div>
        )}
        {detailCard && (
          <CardDetailModal
            open={!!detailCard}
            onClose={() => setDetailCardId(null)}
            card={detailCard.card}
            columnId={detailCard.columnId}
            columns={columns}
            density={cardDensity}
            onUpdate={(updates) =>
              updateCard(detailCard.columnId, detailCard.card.id, updates)
            }
            onMoveCard={(toColumnId) =>
              moveCard(detailCard.columnId, toColumnId, detailCard.card.id)
            }
            onArchive={() => {
              archiveCard(detailCard.columnId, detailCard.card.id);
              setDetailCardId(null);
            }}
            cardTypes={cardTypes}
          />
        )}
      </main>
    </>
  );
}
