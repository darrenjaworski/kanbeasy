import { useMemo, type CSSProperties, type ButtonHTMLAttributes } from "react";
import { Column } from "./Column";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

export function SortableColumnItem({
  id,
  title,
  cards,
  canDrag,
  style,
}: Readonly<{
  id: string;
  title: string;
  cards: import("../board/types").Card[];
  canDrag: boolean;
  style?: React.CSSProperties;
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

  const combinedStyle: CSSProperties = useMemo(
    () => ({
      ...style,
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 10 : undefined,
    }),
    [style, transform, transition, isDragging]
  );

  return (
    <div ref={setNodeRef} style={combinedStyle}>
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
