import { useCallback, useEffect, useRef, useState } from "react";
import type { Card, CardUpdates } from "../board/types";
import { Modal } from "./Modal";
import { ModalHeader } from "./ModalHeader";
import { ExpandIcon } from "./icons";
import { tc } from "../theme/classNames";
import { useInlineEdit } from "../hooks";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  card: Card;
  columnTitle: string;
  onUpdate: (updates: CardUpdates) => void;
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

export function CardDetailModal({
  open,
  onClose,
  card,
  columnTitle,
  onUpdate,
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

  // Description editing — direct onBlur (allows clearing)
  const [tempDescription, setTempDescription] = useState(card.description);
  const descEscaping = useRef(false);

  useEffect(() => {
    setTempDescription(card.description);
  }, [card.description]);

  const handleDescriptionKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === "Escape") {
        descEscaping.current = true;
        setTempDescription(card.description);
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
          icon={ExpandIcon}
          title="Card Details"
          titleId="card-detail-title"
          onClose={onClose}
        />

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
            className={`${tc.input} w-full rounded-md border ${tc.border} px-3 py-2 text-sm resize-y`}
            rows={2}
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
          <label
            htmlFor="card-detail-description"
            className={`block text-xs font-medium ${tc.textMuted} mb-1`}
          >
            Description
          </label>
          <textarea
            id="card-detail-description"
            className={`${tc.input} w-full rounded-md border ${tc.border} px-3 py-2 text-sm resize-y`}
            rows={6}
            value={tempDescription}
            onChange={(e) => setTempDescription(e.target.value)}
            onKeyDown={handleDescriptionKeyDown}
            onBlur={handleDescriptionBlur}
            placeholder="Add a description..."
            data-testid="card-detail-description"
          />
        </div>

        {/* Metadata */}
        <div
          className={`flex flex-wrap gap-x-6 gap-y-1 text-xs ${tc.textFaint}`}
          data-testid="card-detail-metadata"
        >
          <span>
            Column: <strong className={tc.text}>{columnTitle}</strong>
          </span>
          <span>Created: {formatDate(card.createdAt)}</span>
          <span>Updated: {formatDate(card.updatedAt)}</span>
        </div>
      </div>
    </Modal>
  );
}
