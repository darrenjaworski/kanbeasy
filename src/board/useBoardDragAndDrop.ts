import { useMemo, useState } from "react";
import type { DragEndEvent, DragStartEvent } from "@dnd-kit/core";
import type { Column } from "./types";
import {
  reorderColumns,
  moveCardWithinColumn,
  moveCardAcrossColumns,
  dropCardOnColumn,
  findCardInColumns,
} from "./dragUtils";

export type DragType = "card" | "column" | null;

interface UseBoardDragAndDropProps {
  columns: Column[];
  setColumns: (columns: Column[]) => void;
}

interface UseBoardDragAndDropReturn {
  activeType: DragType;
  activeId: string | null;
  activeCard: ReturnType<typeof findCardInColumns>;
  handleDragStart: (event: DragStartEvent) => void;
  handleDragEnd: (event: DragEndEvent) => void;
  handleDragCancel: () => void;
}

/**
 * Custom hook that manages all drag-and-drop logic for the board.
 * Handles dragging columns and cards, including reordering and moving between columns.
 */
export function useBoardDragAndDrop({
  columns,
  setColumns,
}: UseBoardDragAndDropProps): UseBoardDragAndDropReturn {
  const [activeType, setActiveType] = useState<DragType>(null);
  const [activeId, setActiveId] = useState<string | null>(null);

  /**
   * Handles the start of a drag operation.
   * Captures the type (card or column) and ID of the dragged item.
   */
  function handleDragStart(event: DragStartEvent) {
    const { active } = event;
    const type =
      (active.data.current?.type as "card" | "column" | undefined) ?? null;
    setActiveType(type);
    setActiveId(String(active.id));
  }

  /**
   * Handles the end of a drag operation.
   * Determines the type of drag and delegates to the appropriate handler.
   */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (!over) {
      resetDragState();
      return;
    }

    const activeType = active.data.current?.type as string | undefined;
    const overType = over.data.current?.type as string | undefined;

    // Column reordering
    if (activeType === "column" && overType === "column") {
      const newColumns = reorderColumns(
        columns,
        String(active.id),
        String(over.id)
      );
      setColumns(newColumns);
      resetDragState();
      return;
    }

    // Card dragging
    if (activeType === "card" && overType === "card") {
      const fromColId = active.data.current?.columnId as string;
      const toColId = over.data.current?.columnId as string;

      // Same column: reorder within column
      if (fromColId === toColId) {
        const newColumns = moveCardWithinColumn(
          columns,
          fromColId,
          String(active.id),
          String(over.id)
        );
        setColumns(newColumns);
      } else {
        // Different columns: move across columns
        const newColumns = moveCardAcrossColumns(
          columns,
          fromColId,
          toColId,
          String(active.id),
          String(over.id)
        );
        setColumns(newColumns);
      }
      resetDragState();
      return;
    }

    // Card dropped on column area (not on another card)
    if (activeType === "card" && overType === "column-drop") {
      const fromColId = active.data.current?.columnId as string;
      const toColId = over.data.current?.columnId as string;

      if (!toColId) {
        resetDragState();
        return;
      }

      const newColumns = dropCardOnColumn(
        columns,
        fromColId,
        toColId,
        String(active.id)
      );
      setColumns(newColumns);
      resetDragState();
      return;
    }

    resetDragState();
  }

  /**
   * Handles drag cancellation.
   * Resets the drag state without making any changes.
   */
  function handleDragCancel() {
    resetDragState();
  }

  /**
   * Resets the drag state to initial values.
   */
  function resetDragState() {
    // Blur the drag handle so group-focus-within doesn't keep controls visible
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setActiveType(null);
    setActiveId(null);
  }

  /**
   * Finds the active card data for rendering in the DragOverlay.
   * Only computed when actively dragging a card.
   */
  const activeCard = useMemo(() => {
    if (activeType !== "card" || !activeId) return null;
    return findCardInColumns(columns, activeId);
  }, [activeType, activeId, columns]);

  return {
    activeType,
    activeId,
    activeCard,
    handleDragStart,
    handleDragEnd,
    handleDragCancel,
  };
}
