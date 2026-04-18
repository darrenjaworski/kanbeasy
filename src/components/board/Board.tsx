import { useCallback, useEffect, useState } from "react";
import { BoardColumnTabs } from "./BoardColumnTabs";
import { CardDetailModal } from "./CardDetailModal";
import { DesktopBoard } from "./DesktopBoard";
import { MobileBoard } from "./MobileBoard";
import { AddColumn } from "./AddColumn";
import { useBoard } from "../../board/useBoard";
import { useTheme } from "../../theme/useTheme";
import { useBoardDragAndDrop } from "../../board/useBoardDragAndDrop";
import { useIsMobile } from "../../hooks";
import { findCardWithColumn } from "../../board/dragUtils";

export function Board() {
  const { columns, addColumn, setColumns, updateCard, moveCard, archiveCard } =
    useBoard();
  const { cardDensity, cardTypes, columnOrderLocked } = useTheme();
  const isMobile = useIsMobile();

  // Mobile: active column tab index
  const [activeColumnIndex, setActiveColumnIndex] = useState(0);

  // Clamp active index when a column is deleted
  useEffect(() => {
    if (columns.length > 0 && activeColumnIndex >= columns.length) {
      setActiveColumnIndex(columns.length - 1);
    }
  }, [columns.length, activeColumnIndex]);

  // Card detail modal — lifted here so it survives cross-column moves
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
          <MobileBoard
            columns={columns}
            activeColumnIndex={activeColumnIndex}
            onActiveColumnIndexChange={setActiveColumnIndex}
            activeType={activeType}
            activeCard={activeCard}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            handleDragCancel={handleDragCancel}
            onOpenDetail={handleOpenDetail}
          />
        ) : (
          <DesktopBoard
            columns={columns}
            columnOrderLocked={columnOrderLocked}
            activeType={activeType}
            activeCard={activeCard}
            handleDragStart={handleDragStart}
            handleDragEnd={handleDragEnd}
            handleDragCancel={handleDragCancel}
            onAddColumn={() => addColumn("New Column")}
            onOpenDetail={handleOpenDetail}
          />
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
