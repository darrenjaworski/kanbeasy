import { DragOverlay } from "@dnd-kit/core";
import type { Card as BoardCard } from "../board/types";
import { tc } from "../theme/classNames";

interface BoardDragOverlayProps {
  readonly activeType: "card" | "column" | null;
  readonly activeCard: BoardCard | null;
}

export function BoardDragOverlay({
  activeType,
  activeCard,
}: BoardDragOverlayProps) {
  const showDragOverlay = activeType === "card" && activeCard;
  if (!showDragOverlay) return null;
  return (
    <DragOverlay>
      <div
        className={`group/card relative rounded-md border ${tc.border} pr-14 p-2 text-sm bg-white/80 dark:bg-black/30 shadow-lg backdrop-blur-md`}
      >
        <div className={`whitespace-pre-wrap ${tc.text}`}>
          {activeCard.title || "New card"}
        </div>
      </div>
    </DragOverlay>
  );
}
