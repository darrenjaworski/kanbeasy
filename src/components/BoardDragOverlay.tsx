import { Column } from "./Column";
import { DragOverlay } from "@dnd-kit/core";
import type { Column as BoardColumn, Card as BoardCard } from "../board/types";

interface BoardDragOverlayProps {
  readonly activeType: "card" | "column" | null;
  readonly activeId: string | null;
  readonly activeCard: BoardCard | null;
  readonly columns: BoardColumn[];
}

export function BoardDragOverlay({
  activeType,
  activeId,
  activeCard,
  columns,
}: BoardDragOverlayProps) {
  return (
    <DragOverlay>
      {activeType === "card" && activeCard && (
        <div className="group/card relative rounded-md border border-black/10 dark:border-white/10 pr-14 p-2 text-sm bg-white/80 dark:bg-black/30 shadow-lg backdrop-blur-md">
          <div className="whitespace-pre-wrap text-black/80 dark:text-white/80">
            {activeCard.title || "New card"}
          </div>
        </div>
      )}
      {activeType === "column" && activeId && (
        <div className="w-80 shrink-0">
          <Column
            id={activeId}
            title={columns.find((col) => col.id === activeId)?.title || ""}
            cards={columns.find((col) => col.id === activeId)?.cards || []}
            canDrag={false}
            overlayMode
          />
        </div>
      )}
    </DragOverlay>
  );
}
