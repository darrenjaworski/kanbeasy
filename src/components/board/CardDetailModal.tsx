import { useCallback, useEffect, useRef, useState } from "react";
import type { Card, CardUpdates, Column } from "../../board/types";
import type { CardType } from "../../constants/cardTypes";
import { ROWS_FOR_DENSITY, type CardDensity } from "../../theme/types";
import { Modal } from "../shared/Modal";
import { DescriptionField } from "./DescriptionField";
import { ArchiveIcon, MoreIcon } from "../icons";
import { ChecklistProgress } from "../shared/ChecklistProgress";
import { SelectChevron } from "../shared/SelectChevron";
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
      icon={MoreIcon}
      title={`${card.cardTypeId ? `${card.cardTypeId}-${card.number}` : `#${card.number}`} Card Details`}
      className="max-w-lg"
    >
      <div className="space-y-4">
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
            <SelectChevron />
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
            <SelectChevron />
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
