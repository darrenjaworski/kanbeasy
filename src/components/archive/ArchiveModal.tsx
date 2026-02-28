import { useCallback, useEffect, useRef, useState } from "react";
import { useBoard } from "../../board/useBoard";
import { Modal } from "../shared/Modal";
import { ModalHeader } from "../shared/ModalHeader";
import { ConfirmDialog } from "../shared/ConfirmDialog";
import { ArchiveIcon } from "../icons";
import { ArchiveTableRow } from "./ArchiveTableRow";
import { tc } from "../../theme/classNames";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function ArchiveModal({ open, onClose }: Props) {
  const { archive, columns, restoreCards, permanentlyDeleteCards } = useBoard();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const selectAllRef = useRef<HTMLInputElement>(null);

  // Sort newest-archived first
  const sorted = [...archive].sort((a, b) => b.archivedAt - a.archivedAt);

  // Clear selection when archive contents change
  const archiveIds = sorted.map((c) => c.id).join(",");
  useEffect(() => {
    setSelectedIds(new Set());
  }, [archiveIds]);

  // Sync indeterminate state on the select-all checkbox
  useEffect(() => {
    if (selectAllRef.current) {
      const someSelected = selectedIds.size > 0;
      const allSelected = someSelected && selectedIds.size === sorted.length;
      selectAllRef.current.indeterminate = someSelected && !allSelected;
    }
  }, [selectedIds, sorted.length]);

  const toggleCard = useCallback((cardId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(cardId)) {
        next.delete(cardId);
      } else {
        next.add(cardId);
      }
      return next;
    });
  }, []);

  const toggleAll = useCallback(() => {
    setSelectedIds((prev) => {
      if (prev.size === sorted.length) return new Set();
      return new Set(sorted.map((c) => c.id));
    });
  }, [sorted]);

  const handleBulkRestore = useCallback(() => {
    restoreCards(Array.from(selectedIds));
  }, [restoreCards, selectedIds]);

  const handleBulkDelete = useCallback(() => {
    setShowDeleteConfirm(true);
  }, []);

  const confirmBulkDelete = useCallback(() => {
    permanentlyDeleteCards(Array.from(selectedIds));
    setShowDeleteConfirm(false);
  }, [permanentlyDeleteCards, selectedIds]);

  const selectionCount = selectedIds.size;
  const allSelected = sorted.length > 0 && selectionCount === sorted.length;

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="archive-title">
      <div className="p-4 pb-2 shrink-0">
        <ModalHeader
          icon={ArchiveIcon}
          title="Archive"
          titleId="archive-title"
          onClose={onClose}
        />
      </div>

      <div className="p-4 pt-2 overflow-y-auto">
        {sorted.length === 0 ? (
          <p
            className={`text-sm ${tc.textMuted} text-center py-8`}
            data-testid="archive-empty"
          >
            No archived cards.
          </p>
        ) : (
          <>
            {/* Bulk action bar */}
            <div
              className="flex items-center gap-2 mb-3"
              data-testid="archive-action-bar"
            >
              <button
                type="button"
                onClick={handleBulkRestore}
                disabled={selectionCount === 0 || columns.length === 0}
                className={`${tc.button} rounded-md px-3 py-1.5 text-sm disabled:opacity-40`}
                data-testid="archive-bulk-restore"
              >
                Restore{selectionCount > 0 ? ` (${selectionCount})` : ""}
              </button>
              <button
                type="button"
                onClick={handleBulkDelete}
                disabled={selectionCount === 0}
                className={`${tc.dangerButton} rounded-md px-3 py-1.5 text-sm disabled:opacity-40`}
                data-testid="archive-bulk-delete"
              >
                Delete{selectionCount > 0 ? ` (${selectionCount})` : ""}
              </button>
            </div>

            {/* Archive table */}
            <div
              className={`rounded-lg border ${tc.border} overflow-hidden`}
              data-testid="archive-list"
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${tc.glass} border-b ${tc.border}`}>
                    <th className="px-3 py-2 w-8" scope="col">
                      <input
                        ref={selectAllRef}
                        type="checkbox"
                        checked={allSelected}
                        onChange={toggleAll}
                        aria-label="Select all archived cards"
                        className="accent-[var(--color-accent)]"
                        data-testid="archive-select-all"
                      />
                    </th>
                    <th
                      className={`text-right px-3 py-2 font-medium ${tc.textMuted} w-12`}
                      scope="col"
                    >
                      #
                    </th>
                    <th
                      className={`text-left px-3 py-2 font-medium ${tc.textMuted}`}
                      scope="col"
                    >
                      Title
                    </th>
                    <th
                      className={`text-right px-3 py-2 font-medium ${tc.textMuted}`}
                      scope="col"
                    >
                      Archived
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((card, i) => (
                    <ArchiveTableRow
                      key={card.id}
                      card={card}
                      selected={selectedIds.has(card.id)}
                      onToggle={toggleCard}
                      isLast={i === sorted.length - 1}
                    />
                  ))}
                </tbody>
              </table>
            </div>

            <ConfirmDialog
              open={showDeleteConfirm}
              onClose={() => setShowDeleteConfirm(false)}
              onConfirm={confirmBulkDelete}
              title={`Delete ${selectionCount} archived card${selectionCount === 1 ? "" : "s"}?`}
              message={`${selectionCount} card${selectionCount === 1 ? "" : "s"} will be deleted forever. This cannot be undone.`}
            />
          </>
        )}
      </div>
    </Modal>
  );
}
