import { ArchiveIcon, CardDragIcon, CopyIcon, MoreIcon } from "../icons";
import type { HTMLAttributes } from "react";
import { asDOMAttributes } from "../../utils/dnd";
import { Tooltip } from "../shared/Tooltip";
import { tc } from "../../theme/classNames";
import { useIsMobile } from "../../hooks";

interface CardControlsProps {
  readonly canDrag: boolean;
  readonly cardTitle: string;
  readonly onCopy: () => void;
  readonly onArchive: () => void;
  readonly onOpenDetail: () => void;
  readonly setActivatorNodeRef: (node: HTMLElement | null) => void;
  readonly attributes: HTMLAttributes<HTMLButtonElement>;
  readonly listeners?: Record<string, unknown>;
  readonly index: number;
}

export function CardControls({
  canDrag,
  cardTitle,
  onCopy,
  onArchive,
  onOpenDetail,
  setActivatorNodeRef,
  attributes,
  listeners,
  index,
}: CardControlsProps) {
  const isMobile = useIsMobile();
  return (
    <div
      className={`absolute right-2 top-2 z-1 inline-flex items-center border ${tc.border} ${tc.glassSubtle} backdrop-blur-sm rounded-full transition-opacity ${isMobile ? "opacity-100" : "opacity-0 group-hover/card:opacity-100 group-focus-within/card:opacity-100"}`}
    >
      {canDrag && !isMobile && (
        <Tooltip content="Drag to reorder">
          <button
            type="button"
            ref={setActivatorNodeRef}
            {...asDOMAttributes<HTMLButtonElement>(attributes, listeners)}
            aria-label={`Drag card ${cardTitle || "Untitled"}`}
            className={`${tc.iconButton} h-6 w-6 rounded-l-full hover:cursor-grab active:cursor-grabbing`}
            data-testid={`card-drag-${index}`}
          >
            <CardDragIcon className="size-4" />
          </button>
        </Tooltip>
      )}
      {canDrag && !isMobile && (
        <span aria-hidden className={`${tc.separator} h-6 w-px`} />
      )}
      <Tooltip content="Copy card">
        <button
          type="button"
          onClick={onCopy}
          aria-label={`Copy card ${cardTitle || "Untitled"}`}
          className={`${tc.iconButton} h-6 w-6${canDrag && !isMobile ? "" : " rounded-l-full"}`}
          data-testid={`card-copy-${index}`}
        >
          <CopyIcon className="size-4" />
        </button>
      </Tooltip>
      <span aria-hidden className={`${tc.separator} h-6 w-px`} />
      <Tooltip content="Card details">
        <button
          type="button"
          onClick={onOpenDetail}
          aria-label={`More details for ${cardTitle || "Untitled"}`}
          className={`${tc.iconButton} h-6 w-6`}
          data-testid={`card-detail-${index}`}
        >
          <MoreIcon className="size-4" />
        </button>
      </Tooltip>
      <span aria-hidden className={`${tc.separator} h-6 w-px`} />
      <Tooltip content="Archive card">
        <button
          type="button"
          onClick={onArchive}
          aria-label={`Archive card ${cardTitle || "Untitled"}`}
          className={`${tc.iconButton} h-6 w-6 rounded-r-full`}
          data-testid={`card-archive-${index}`}
        >
          <ArchiveIcon className="size-4" />
        </button>
      </Tooltip>
    </div>
  );
}
