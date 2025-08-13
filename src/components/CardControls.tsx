import React from "react";
import { CardDragIcon } from "./icons/CardDragIcon";
import { CloseIcon } from "./icons/CloseIcon";

interface CardControlsProps {
  readonly canDrag: boolean;
  readonly cardTitle: string;
  readonly onRemove: () => void;
  readonly setActivatorNodeRef: (node: HTMLElement | null) => void;
  readonly attributes: React.HTMLAttributes<HTMLButtonElement>;
  readonly listeners?: Record<string, unknown>;
}

export function CardControls({
  canDrag,
  cardTitle,
  onRemove,
  setActivatorNodeRef,
  attributes,
  listeners,
}: CardControlsProps) {
  return (
    <div className="absolute right-1 top-1 z-1 inline-flex items-center overflow-hidden rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100">
      {canDrag && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...(attributes as unknown as React.HTMLAttributes<HTMLButtonElement>)}
          {...(listeners as unknown as React.HTMLAttributes<HTMLButtonElement>)}
          aria-label={`Drag card ${cardTitle || "Untitled"}`}
          title="Drag to reorder"
          className="h-6 w-6 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white hover:cursor-grab active:cursor-grabbing"
        >
          <CardDragIcon className="size-4" />
        </button>
      )}
      {canDrag && (
        <span aria-hidden className="h-6 w-px bg-black/10 dark:bg-white/10" />
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove card ${cardTitle || "Untitled"}`}
        title="Remove card"
        className="h-6 w-6 inline-flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white"
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}
