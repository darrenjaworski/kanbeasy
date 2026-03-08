import type { RefObject } from "react";
import { tc } from "../../theme/classNames";
import { ChecklistProgress } from "../shared/ChecklistProgress";
import { DueDateBadge } from "../shared/DueDateBadge";
import { CardTypeBadge } from "../shared/CardTypeBadge";
import type { CardLayout } from "../../constants/cardLayout";
import { formatDate } from "../../utils/formatDate";

type CardBodyProps = Readonly<{
  number: number;
  cardTypeId: string | null;
  cardTypeColor?: string;
  cardTypeLabel?: string;
  title: string;
  description: string | null;
  dueDate: string | null;
  createdAt?: number;
  updatedAt?: number;
  rows: number;
  /** When provided, renders fields dynamically from the layout config. */
  cardLayout?: CardLayout;
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
  cardTypeLabel,
  title,
  description,
  dueDate,
  createdAt,
  updatedAt,
  rows,
  cardLayout,
  readOnly = false,
  textareaRef,
  textareaId,
  testId,
  onKeyDown,
  onBlur,
}: CardBodyProps) {
  // Legacy rendering when no layout config is provided
  if (!cardLayout) {
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

  // Dynamic rendering based on layout config — each field gets its own row.
  // The first rendered field has no top margin; subsequent fields get mt-1.
  const visibleFields = cardLayout.filter((f) => f.visible);
  let isFirst = true;

  function gap() {
    if (isFirst) {
      isFirst = false;
      return "";
    }
    return "mt-1";
  }

  return (
    <>
      {visibleFields.map((field) => {
        switch (field.id) {
          case "badge":
            return (
              <div key={field.id} className={gap()}>
                <CardTypeBadge
                  number={number}
                  cardTypeId={cardTypeId}
                  cardTypeColor={cardTypeColor}
                />
              </div>
            );
          case "cardTypeName":
            if (!cardTypeLabel) return null;
            return (
              <div key={field.id} className={gap()}>
                <span
                  className="inline-block text-xs font-medium rounded-sm px-1 select-none"
                  style={
                    cardTypeColor
                      ? {
                          backgroundColor: `${cardTypeColor}20`,
                          color: cardTypeColor,
                        }
                      : undefined
                  }
                  data-testid="card-type-name"
                >
                  {cardTypeLabel}
                </span>
              </div>
            );
          case "title": {
            const titleRows = field.options?.lines ?? rows;
            const mt = gap();
            return (
              <textarea
                key={field.id}
                ref={textareaRef}
                id={textareaId}
                aria-label="Card content"
                defaultValue={title || "New card"}
                readOnly={readOnly}
                tabIndex={readOnly ? -1 : undefined}
                className={`${tc.input} ${mt} w-full rounded-xs ${
                  readOnly
                    ? "resize-none cursor-default"
                    : "resize-none hover:resize-y focus:resize-y"
                }`}
                rows={titleRows}
                onKeyDown={readOnly ? undefined : onKeyDown}
                onBlur={readOnly ? undefined : onBlur}
                data-testid={testId}
              />
            );
          }
          case "description":
            if (!description) return null;
            return (
              <p
                key={field.id}
                className={`text-xs ${tc.textFaint} ${gap()} whitespace-pre-line`}
                style={{
                  display: "-webkit-box",
                  WebkitLineClamp: field.options?.lines ?? 2,
                  WebkitBoxOrient: "vertical" as const,
                  overflow: "hidden",
                }}
                data-testid="card-description-preview"
              >
                {description}
              </p>
            );
          case "checklist":
            return (
              <div key={field.id} className={gap()}>
                <ChecklistProgress
                  description={description ?? ""}
                  showCount={false}
                />
              </div>
            );
          case "dueDate":
            return (
              <div key={field.id} className={gap()}>
                <DueDateBadge dueDate={dueDate} />
              </div>
            );
          case "createdAt":
            if (createdAt === undefined) return null;
            return (
              <p
                key={field.id}
                className={`text-xs ${tc.textFaint} ${gap()}`}
                data-testid="card-created-at"
              >
                Created {formatDate(createdAt)}
              </p>
            );
          case "updatedAt":
            if (updatedAt === undefined) return null;
            return (
              <p
                key={field.id}
                className={`text-xs ${tc.textFaint} ${gap()}`}
                data-testid="card-updated-at"
              >
                Updated {formatDate(updatedAt)}
              </p>
            );
          default:
            return null;
        }
      })}
    </>
  );
}
