import { DragOverlay } from "@dnd-kit/core";
import type { Card as BoardCard } from "../../board/types";
import { tc } from "../../theme/classNames";
import { useIsMobile } from "../../hooks";

interface BoardDragOverlayProps {
  readonly activeType: "card" | "column" | null;
  readonly activeCard: BoardCard | null;
}

export function BoardDragOverlay({
  activeType,
  activeCard,
}: BoardDragOverlayProps) {
  const isMobile = useIsMobile();
  const showDragOverlay = activeType === "card" && activeCard;
  if (!showDragOverlay) return null;
  return (
    <DragOverlay>
      <div className={isMobile ? "w-4/5" : undefined}>
        <div
          className={`group/card relative rounded-md border ${tc.border} pr-14 p-2 text-sm ${tc.glassOpaque} shadow-lg backdrop-blur-md`}
        >
          <div className={`whitespace-pre-wrap ${tc.text}`}>
            {activeCard.title || "New card"}
          </div>
        </div>
      </div>
    </DragOverlay>
  );
}
