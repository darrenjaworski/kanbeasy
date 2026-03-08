import type { RefObject } from "react";
import { tc } from "../../theme/classNames";
import { ChecklistProgress } from "../shared/ChecklistProgress";
import { DueDateBadge } from "../shared/DueDateBadge";
import { CardTypeBadge } from "../shared/CardTypeBadge";

type CardBodyProps = Readonly<{
  number: number;
  cardTypeId: string | null;
  cardTypeColor?: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  rows: number;
  /** When true, the textarea is read-only with no resize or interaction. */
  readOnly?: boolean;
  /** Refs and handlers for interactive (board) mode. */
  textareaRef?: RefObject<HTMLTextAreaElement | null>;
  textareaId?: string;
  testId?: string;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  onBlur?: (e: React.FocusEvent<HTMLTextAreaElement>) => void;
}>;

export function CardBody({
  number,
  cardTypeId,
  cardTypeColor,
  title,
  description,
  dueDate,
  rows,
  readOnly = false,
  textareaRef,
  textareaId,
  testId,
  onKeyDown,
  onBlur,
}: CardBodyProps) {
  return (
    <>
      <CardTypeBadge
        number={number}
        cardTypeId={cardTypeId}
        cardTypeColor={cardTypeColor}
      />
      <textarea
        ref={textareaRef}
        id={textareaId}
        aria-label="Card content"
        defaultValue={title || "New card"}
        readOnly={readOnly}
        tabIndex={readOnly ? -1 : undefined}
        className={`${tc.input} mt-1 w-full rounded-xs ${
          readOnly
            ? "resize-none cursor-default"
            : "resize-none hover:resize-y focus:resize-y"
        }`}
        rows={rows}
        onKeyDown={readOnly ? undefined : onKeyDown}
        onBlur={readOnly ? undefined : onBlur}
        data-testid={testId}
      />
      <div className="flex items-center gap-2 empty:hidden">
        <ChecklistProgress
          description={description ?? ""}
          className="flex-1"
          showCount={false}
        />
        <DueDateBadge dueDate={dueDate} />
      </div>
    </>
  );
}
