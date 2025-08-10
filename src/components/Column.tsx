import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import type { Card } from "../board/types";
import { useBoard } from "../board/useBoard";
import dragIcon from "../icons/drag-indicator.svg";
import closeIcon from "../icons/close.svg";
import sortIcon from "../icons/sort.svg";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

type Props = Readonly<{
  id: string;
  title: string;
  cards: Card[];
  dragHandleRef?: (el: HTMLButtonElement | null) => void;
  dragHandleProps?: React.HTMLAttributes<HTMLButtonElement>;
}>;

export function Column({
  id,
  title,
  cards,
  dragHandleRef,
  dragHandleProps,
}: Props) {
  const {
    addCard,
    removeColumn,
    removeCard,
    updateColumn,
    updateCard,
    reorderCard,
  } = useBoard();
  const [tempTitle, setTempTitle] = useState(title);
  const inputRef = useRef<HTMLInputElement>(null);
  useEffect(() => {
    setTempTitle(title);
  }, [title]);
  return (
    <section
      data-column-id={id}
      aria-label={title || "column"}
      className="group relative rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark p-3"
    >
      {/* Combined drag + delete control */}
      <div className="absolute right-2 top-2 z-10 inline-flex items-center overflow-hidden rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 opacity-0 transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          ref={dragHandleRef}
          aria-label={`Drag column ${title || "column"}`}
          title="Drag to reorder"
          {...(dragHandleProps as unknown as React.HTMLAttributes<HTMLButtonElement>)}
          className="h-8 w-8 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <img
            src={dragIcon}
            alt=""
            aria-hidden
            className="size-5 opacity-80"
          />
        </button>
        <span aria-hidden className="h-6 w-px bg-black/10 dark:bg-white/10" />
        <button
          type="button"
          onClick={() => removeColumn(id)}
          aria-label={`Remove column ${title || "column"}`}
          title="Remove column"
          className="h-8 w-8 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <img
            src={closeIcon}
            alt=""
            aria-hidden
            className="size-5 opacity-80"
          />
        </button>
      </div>
      <div className="mb-3">
        <input
          ref={inputRef}
          type="text"
          aria-label="Column title"
          className="w-full bg-transparent px-0 py-0 text-base font-semibold tracking-tight opacity-80 border-0 outline-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 rounded-sm"
          value={tempTitle}
          onChange={(e) => setTempTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              (e.currentTarget as HTMLInputElement).blur();
            }
            if (e.key === "Escape") {
              setTempTitle(title);
              (e.currentTarget as HTMLInputElement).blur();
            }
          }}
          onBlur={() => {
            const next = tempTitle.trim();
            if (!next) {
              setTempTitle(title);
              return;
            }
            if (next !== title) updateColumn(id, next);
          }}
        />
      </div>
      {/* Add card button moved to the top of the column */}
      <div className="mb-3">
        <button
          type="button"
          className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 px-3 py-1.5 text-sm hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
          onClick={() => addCard(id, "New card")}
          aria-label={`Add card to ${title || "column"}`}
        >
          Add card
        </button>
      </div>
      <CardList
        cards={cards}
        onRemove={(cardId) => removeCard(id, cardId)}
        onUpdate={(cardId, title) => updateCard(id, cardId, title)}
        onReorder={(activeId, overId) => reorderCard(id, activeId, overId)}
      />
    </section>
  );
}

function CardList({
  cards,
  onRemove,
  onUpdate,
  onReorder,
}: Readonly<{
  cards: Card[];
  onRemove: (cardId: string) => void;
  onUpdate: (cardId: string, title: string) => void;
  onReorder: (activeId: string, overId: string) => void;
}>) {
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    onReorder(String(active.id), String(over.id));
  };

  if (cards.length === 0) {
    return <p className="text-xs opacity-60">No cards yet</p>;
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext
        items={cards.map((c) => c.id)}
        strategy={verticalListSortingStrategy}
      >
        <div className="flex flex-col gap-2 min-h-28">
          {cards.map((card) => (
            <SortableCardItem
              key={card.id}
              card={card}
              onRemove={() => onRemove(card.id)}
              onUpdate={(title) => onUpdate(card.id, title)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableCardItem({
  card,
  onRemove,
  onUpdate,
}: Readonly<{
  card: Card;
  onRemove: () => void;
  onUpdate: (title: string) => void;
}>) {
  const {
    attributes,
    listeners,
    setActivatorNodeRef,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: card.id });

  const style: CSSProperties = useMemo(
    () => ({
      transform: CSS.Transform.toString(transform),
      transition,
      zIndex: isDragging ? 5 : undefined,
    }),
    [transform, transition, isDragging]
  );

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`group/card relative rounded-md border border-black/10 dark:border-white/10 pr-7 p-2 text-sm bg-white/60 dark:bg-black/20 ${
        isDragging
          ? "backdrop-blur-sm supports-[backdrop-filter]:bg-white/40 supports-[backdrop-filter]:dark:bg-black/30"
          : ""
      }`}
    >
      {/* Combined delete + drag control (vertical), mirrors column-level style */}
      <div className="absolute right-1 top-1 z-10 inline-flex flex-col items-center overflow-hidden rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within:opacity-100">
        <button
          type="button"
          onClick={onRemove}
          aria-label={`Remove card ${card.title || "Untitled"}`}
          title="Remove card"
          className="h-6 w-6 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <img
            src={closeIcon}
            alt=""
            aria-hidden
            className="size-4 opacity-80"
          />
        </button>
        <span aria-hidden className="w-6 h-px bg-black/10 dark:bg-white/10" />
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...(attributes as unknown as React.HTMLAttributes<HTMLButtonElement>)}
          {...(listeners as unknown as React.HTMLAttributes<HTMLButtonElement>)}
          aria-label={`Drag card ${card.title || "Untitled"}`}
          title="Drag to reorder"
          className="h-6 w-6 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500"
        >
          <img
            src={sortIcon}
            alt=""
            aria-hidden
            className="size-4 opacity-80"
          />
        </button>
      </div>

      <textarea
        aria-label="Card content"
        defaultValue={card.title || "New card"}
        className="w-full resize-y rounded-sm bg-transparent outline-none border-0 focus-visible:ring-2 focus-visible:ring-blue-500"
        rows={2}
        onKeyDown={(e) => {
          if (e.key === "Enter" && !e.shiftKey) {
            e.preventDefault();
            (e.currentTarget as HTMLTextAreaElement).blur();
          }
          if (e.key === "Escape") {
            (e.currentTarget as HTMLTextAreaElement).value =
              card.title || "New card";
            (e.currentTarget as HTMLTextAreaElement).blur();
          }
        }}
        onBlur={(e) => {
          const next = e.currentTarget.value.trim();
          if (!next) {
            e.currentTarget.value = card.title || "New card";
            return;
          }
          if (next !== card.title) onUpdate(next);
        }}
      />
    </div>
  );
}
