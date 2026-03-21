import { useMemo, type CSSProperties, type ButtonHTMLAttributes } from "react";
import type { Card } from "../../board/types";
import { Column } from "./Column";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableColumnItem({
  id,
  title,
  cards,
  canDrag,
  disabled,
  style,
  index,
  columnCount,
  onOpenDetail,
}: Readonly<{
  id: string;
  title: string;
  cards: Card[];
  canDrag: boolean;
  disabled?: boolean;
  style?: React.CSSProperties;
  index?: number;
  columnCount?: number;
  onOpenDetail?: (cardId: string) => void;
}>) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id, data: { type: "column" }, disabled });

  const combinedStyle: CSSProperties = useMemo(
    () => ({
      ...style,
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : undefined,
    }),
    [style, transform, transition, isDragging],
  );

  return (
    <div ref={setNodeRef} style={combinedStyle}>
      <Column
        index={index}
        id={id}
        title={title}
        cards={cards}
        canDrag={canDrag}
        columnCount={columnCount}
        onOpenDetail={onOpenDetail}
        isDragging={isDragging}
        dragHandleRef={setActivatorNodeRef}
        dragHandleProps={{
          ...(attributes as unknown as ButtonHTMLAttributes<HTMLButtonElement>),
          ...(listeners as unknown as ButtonHTMLAttributes<HTMLButtonElement>),
        }}
      />
    </div>
  );
}
