import React from "react";
import { CardDragIcon, CloseIcon, CopyIcon, MoreIcon } from "./icons";
import { tc } from "../theme/classNames";

interface CardControlsProps {
  readonly canDrag: boolean;
  readonly cardTitle: string;
  readonly onCopy: () => void;
  readonly onRemove: () => void;
  readonly onOpenDetail: () => void;
  readonly setActivatorNodeRef: (node: HTMLElement | null) => void;
  readonly attributes: React.HTMLAttributes<HTMLButtonElement>;
  readonly listeners?: Record<string, unknown>;
  readonly index: number;
}

export function CardControls({
  canDrag,
  cardTitle,
  onCopy,
  onRemove,
  onOpenDetail,
  setActivatorNodeRef,
  attributes,
  listeners,
  index,
}: CardControlsProps) {
  return (
    <div
      className={`absolute right-1 top-1 z-1 inline-flex items-center overflow-hidden border ${tc.border} bg-white/40 dark:bg-black/10 backdrop-blur-sm rounded-full opacity-0 transition-opacity group-hover/card:opacity-100 group-focus-within/card:opacity-100`}
    >
      {canDrag && (
        <button
          type="button"
          ref={setActivatorNodeRef}
          {...(attributes as unknown as React.HTMLAttributes<HTMLButtonElement>)}
          {...(listeners as unknown as React.HTMLAttributes<HTMLButtonElement>)}
          aria-label={`Drag card ${cardTitle || "Untitled"}`}
          title="Drag to reorder"
          className={`${tc.iconButton} h-6 w-6 hover:cursor-grab active:cursor-grabbing`}
          data-testid={`card-drag-${index}`}
        >
          <CardDragIcon className="size-4" />
        </button>
      )}
      {canDrag && <span aria-hidden className={`${tc.separator} h-6 w-px`} />}
      <button
        type="button"
        onClick={onCopy}
        aria-label={`Copy card ${cardTitle || "Untitled"}`}
        title="Copy card"
        className={`${tc.iconButton} h-6 w-6`}
        data-testid={`card-copy-${index}`}
      >
        <CopyIcon className="size-4" />
      </button>
      <span aria-hidden className={`${tc.separator} h-6 w-px`} />
      <button
        type="button"
        onClick={onOpenDetail}
        aria-label={`More details for ${cardTitle || "Untitled"}`}
        title="More details"
        className={`${tc.iconButton} h-6 w-6`}
        data-testid={`card-detail-${index}`}
      >
        <MoreIcon className="size-4" />
      </button>
      <span aria-hidden className={`${tc.separator} h-6 w-px`} />
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Remove card ${cardTitle || "Untitled"}`}
        title="Remove card"
        className={`${tc.iconButton} h-6 w-6`}
        data-testid={`card-remove-${index}`}
      >
        <CloseIcon className="size-4" />
      </button>
    </div>
  );
}
