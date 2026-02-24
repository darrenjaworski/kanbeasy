import { useCallback, useEffect, useRef, useState } from "react";
import type { Card, CardUpdates, Column } from "../board/types";
import type { CardDensity } from "../theme/types";
import { Modal } from "./Modal";
import { ModalHeader } from "./ModalHeader";
import { MarkdownPreview } from "./MarkdownPreview";
import { MoreIcon } from "./icons";
import { tc } from "../theme/classNames";
import { useInlineEdit } from "../hooks";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  card: Card;
  columnId: string;
  columns: Column[];
  density: CardDensity;
  onUpdate: (updates: CardUpdates) => void;
  onMoveCard: (toColumnId: string) => void;
}>;

function formatDate(ts: number): string {
  return new Date(ts).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

const ROWS_FOR_DENSITY: Record<CardDensity, number> = {
  small: 1,
  medium: 2,
  large: 3,
};

export function CardDetailModal({
  open,
  onClose,
  card,
  columnId,
  columns,
  density,
  onUpdate,
  onMoveCard,
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

  // Description editing — click-to-edit with markdown preview
  const [tempDescription, setTempDescription] = useState(card.description);
  const [editingDescription, setEditingDescription] = useState(false);
  const descEscaping = useRef(false);
  const descRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    setTempDescription(card.description);
  }, [card.description]);

  useEffect(() => {
    if (editingDescription) {
      descRef.current?.focus();
    }
  }, [editingDescription]);

  const handleDescriptionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        descEscaping.current = true;
        setTempDescription(card.description);
        setEditingDescription(false);
        e.currentTarget.blur();
      }
    },
    [card.description],
  );

  const handleDescriptionBlur = useCallback(() => {
    if (descEscaping.current) {
      descEscaping.current = false;
      return;
    }
    const next = tempDescription.trim();
    if (next !== card.description) {
      onUpdate({ description: next });
    }
    setEditingDescription(false);
  }, [tempDescription, card.description, onUpdate]);

  return (
    <Modal
      open={open}
      onClose={onClose}
      aria-labelledby="card-detail-title"
      className="max-w-lg"
    >
      <div className="p-5 space-y-4">
        <ModalHeader
          icon={MoreIcon}
          title="Card Details"
          titleId="card-detail-title"
          onClose={onClose}
        />

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
          <label className={`block text-xs font-medium ${tc.textMuted} mb-1`}>
            Description
          </label>
          {editingDescription ? (
            <>
              <textarea
                ref={descRef}
                id="card-detail-description"
                className={`bg-transparent outline-hidden ${tc.focusRing} ${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 text-sm resize-y`}
                rows={4}
                value={tempDescription}
                onChange={(e) => setTempDescription(e.target.value)}
                onKeyDown={handleDescriptionKeyDown}
                onBlur={handleDescriptionBlur}
                placeholder="Add a description..."
                data-testid="card-detail-description"
              />
              <p className={`text-xs ${tc.textFaint} mt-1`}>
                Supports Markdown: **bold**, *italic*, - lists, [links](url),
                and more
              </p>
            </>
          ) : tempDescription ? (
            <div
              role="button"
              tabIndex={0}
              className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 cursor-pointer min-h-[4.5rem]`}
              onClick={() => setEditingDescription(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditingDescription(true);
                }
              }}
              data-testid="card-detail-description-preview"
            >
              <MarkdownPreview content={tempDescription} />
            </div>
          ) : (
            <div
              role="button"
              tabIndex={0}
              className={`${tc.glass} w-full rounded-md border ${tc.border} px-3 py-2 cursor-pointer min-h-[4.5rem] ${tc.textFaint} text-sm`}
              onClick={() => setEditingDescription(true)}
              onKeyDown={(e) => {
                if (e.key === "Enter" || e.key === " ") {
                  e.preventDefault();
                  setEditingDescription(true);
                }
              }}
              data-testid="card-detail-description-placeholder"
            >
              Add a description...
            </div>
          )}
        </div>

        {/* Timestamps footer */}
        <div
          className={`border-t ${tc.border} pt-3 flex flex-wrap gap-y-1 text-xs ${tc.textFaint}`}
          data-testid="card-detail-metadata"
        >
          <span>Created: {formatDate(card.createdAt)}</span>
          <span className="ml-auto">Updated: {formatDate(card.updatedAt)}</span>
        </div>
      </div>
    </Modal>
  );
}
