import { useCallback, useEffect, useRef, useState } from "react";
import type { Card, CardUpdates, Column } from "../../board/types";
import type { CardType } from "../../constants/cardTypes";
import { ROWS_FOR_DENSITY, type CardDensity } from "../../theme/types";
import { Modal } from "../shared/Modal";
import { ModalHeader } from "../shared/ModalHeader";
import { DescriptionField } from "./DescriptionField";
import { ArchiveIcon, MoreIcon } from "../icons";
import { ChecklistProgress } from "../shared/ChecklistProgress";
import { tc } from "../../theme/classNames";
import { useInlineEdit } from "../../hooks";
import { formatDateTime } from "../../utils/formatDate";
type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  card: Card;
  columnId: string;
  columns: Column[];
  density: CardDensity;
  onUpdate: (updates: CardUpdates) => void;
  onMoveCard: (toColumnId: string) => void;
  onArchive: () => void;
  cardTypes: CardType[];
}>;

export function CardDetailModal({
  open,
  onClose,
  card,
  columnId,
  columns,
  density,
  onUpdate,
  onMoveCard,
  onArchive,
  cardTypes,
}: Props) {
  // Title editing — uses useInlineEdit (reverts on empty)
  const [tempTitle, setTempTitle] = useState(card.title);
  const titleRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempTitle(card.title);
  }, [card.title]);

  const revertTitle = useCallback(() => setTempTitle(card.title), [card.title]);
  const saveTitle = useCallback(
    (value: string) => onUpdate({ title: value }),
    [onUpdate],
  );
  const { onKeyDown: titleKeyDown, onBlur: titleBlur } = useInlineEdit({
    originalValue: card.title,
    onSave: saveTitle,
    onRevert: revertTitle,
    multiline: true,
  });

  const handleDescriptionSave = useCallback(
    (value: string) => onUpdate({ description: value }),
    [onUpdate],
  );

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="card-detail-title"
      className="max-w-lg"
    >
      <div className="p-4 pb-2 shrink-0">
        <ModalHeader
          icon={MoreIcon}
          title={`${card.cardTypeId ? `${card.cardTypeId}-${card.number}` : `#${card.number}`} Card Details`}
          titleId="card-detail-title"
          onClose={onClose}
        />
      </div>

      <div className="p-4 pt-3 space-y-4 overflow-y-auto">
        {/* Column selector */}
        <div>
          <label
            htmlFor="card-detail-column"
            className={`block text-xs font-medium ${tc.textMuted} mb-1`}
          >
            Column
          </label>
          <div className="relative">
            <select
              id="card-detail-column"
              value={columnId}
              onChange={(e) => onMoveCard(e.target.value)}
              className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 text-sm ${tc.text} ${tc.focusRing} appearance-none pr-8 cursor-pointer`}
              data-testid="card-detail-column"
            >
              {columns.map((col) => (
                <option key={col.id} value={col.id}>
                  {col.title || "Untitled"}
                </option>
              ))}
            </select>
            <svg
              className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 ${tc.textFaint}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Type selector */}
        <div>
          <label
            htmlFor="card-detail-type"
            className={`block text-xs font-medium ${tc.textMuted} mb-1`}
          >
            Type
          </label>
          <div className="relative">
            <select
              id="card-detail-type"
              value={card.cardTypeId ?? ""}
              onChange={(e) => {
                const selectedId = e.target.value || null;
                const selectedType = selectedId
                  ? cardTypes.find((t) => t.id === selectedId)
                  : undefined;
                onUpdate({
                  cardTypeId: selectedId,
                  cardTypeLabel: selectedType?.label,
                  cardTypeColor: selectedType?.color,
                });
              }}
              className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 text-sm ${tc.text} ${tc.focusRing} appearance-none pr-8 cursor-pointer`}
              data-testid="card-detail-type"
            >
              <option value="">None</option>
              {cardTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.label} ({t.id})
                </option>
              ))}
            </select>
            <svg
              className={`pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 size-4 ${tc.textFaint}`}
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
                clipRule="evenodd"
              />
            </svg>
          </div>
        </div>

        {/* Due date */}
        <div>
          <label
            htmlFor="card-detail-due-date"
            className={`block text-xs font-medium ${tc.textMuted} mb-1`}
          >
            Due date
          </label>
          <input
            type="date"
            id="card-detail-due-date"
            value={card.dueDate ?? ""}
            onChange={(e) => onUpdate({ dueDate: e.target.value || null })}
            className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 text-sm ${tc.text} ${tc.focusRing}`}
            data-testid="card-detail-due-date"
          />
        </div>

        {/* Title */}
        <div>
          <label
            htmlFor="card-detail-title-input"
            className={`block text-xs font-medium ${tc.textMuted} mb-1`}
          >
            Title
          </label>
          <textarea
            ref={titleRef}
            id="card-detail-title-input"
            className={`bg-transparent outline-hidden ${tc.focusRing} ${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 text-sm resize-y`}
            rows={ROWS_FOR_DENSITY[density]}
            value={tempTitle}
            onChange={(e) => setTempTitle(e.target.value)}
            onKeyDown={titleKeyDown}
            onBlur={titleBlur}
            onFocus={(e) => e.target.select()}
            data-testid="card-detail-title"
          />
        </div>

        {/* Description */}
        <div>
          <span className={`block text-xs font-medium ${tc.textMuted} mb-1`}>
            Description
          </span>
          <DescriptionField
            description={card.description}
            onSave={handleDescriptionSave}
          />
          <ChecklistProgress description={card.description} className="mt-2" />
        </div>

        {/* Archive button */}
        <button
          type="button"
          onClick={onArchive}
          className={`${tc.dangerButton} w-full rounded-md px-3 py-1.5 inline-flex items-center justify-center gap-2`}
          data-testid="card-detail-archive"
        >
          <ArchiveIcon className="size-4" />
          Archive card
        </button>

        {/* Metadata footer */}
        <div
          className={`border-t ${tc.border} pt-3 flex flex-col gap-1 text-xs ${tc.textFaint}`}
          data-testid="card-detail-metadata"
        >
          <span>Created: {formatDateTime(card.createdAt)}</span>
          <span>Updated: {formatDateTime(card.updatedAt)}</span>
        </div>
      </div>
    </Modal>
  );
}
