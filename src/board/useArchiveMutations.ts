import { useCallback } from "react";
import type {
  ArchivedCard,
  BoardContextValue,
  BoardState,
  Card,
} from "./types";

export function useArchiveMutations(
  setState: React.Dispatch<React.SetStateAction<BoardState>>,
) {
  const archiveCard = useCallback<BoardContextValue["archiveCard"]>(
    (columnId, cardId) => {
      setState((prev) => {
        const colIdx = prev.columns.findIndex((c) => c.id === columnId);
        if (colIdx === -1) return prev;
        const col = prev.columns[colIdx];
        const card = col.cards.find((c) => c.id === cardId);
        if (!card) return prev;
        const now = Date.now();
        const archived: ArchivedCard = {
          ...card,
          archivedAt: now,
          archivedFromColumnId: columnId,
        };
        const newCards = col.cards.filter((c) => c.id !== cardId);
        const newColumns = prev.columns.slice();
        newColumns[colIdx] = { ...col, cards: newCards, updatedAt: now };
        return { columns: newColumns, archive: [...prev.archive, archived] };
      });
    },
    [setState],
  );

  const restoreCard = useCallback<BoardContextValue["restoreCard"]>(
    (archivedCardId, targetColumnId) => {
      setState((prev) => {
        const archivedCard = prev.archive.find((c) => c.id === archivedCardId);
        if (!archivedCard) return prev;
        const colIdx = prev.columns.findIndex((c) => c.id === targetColumnId);
        if (colIdx === -1) return prev;
        const now = Date.now();
        const {
          archivedAt: _,
          archivedFromColumnId: __,
          ...cardFields
        } = archivedCard;
        const restoredCard: Card = {
          ...cardFields,
          updatedAt: now,
          columnHistory: [
            ...cardFields.columnHistory,
            { columnId: targetColumnId, enteredAt: now },
          ],
        };
        const col = prev.columns[colIdx];
        const newColumns = prev.columns.slice();
        newColumns[colIdx] = {
          ...col,
          cards: [restoredCard, ...col.cards],
          updatedAt: now,
        };
        return {
          columns: newColumns,
          archive: prev.archive.filter((c) => c.id !== archivedCardId),
        };
      });
    },
    [setState],
  );

  const restoreCards = useCallback<BoardContextValue["restoreCards"]>(
    (cardIds) => {
      setState((prev) => {
        const idsToRestore = new Set(cardIds);
        const cardsToRestore = prev.archive.filter((c) =>
          idsToRestore.has(c.id),
        );
        if (cardsToRestore.length === 0) return prev;
        const now = Date.now();
        const newColumns = prev.columns.slice();
        for (const archived of cardsToRestore) {
          const colIdx = newColumns.findIndex(
            (c) => c.id === archived.archivedFromColumnId,
          );
          const targetIdx = colIdx !== -1 ? colIdx : 0;
          if (targetIdx >= newColumns.length) continue;
          const {
            archivedAt: _,
            archivedFromColumnId: __,
            ...cardFields
          } = archived;
          const restoredCard: Card = {
            ...cardFields,
            updatedAt: now,
            columnHistory: [
              ...cardFields.columnHistory,
              { columnId: newColumns[targetIdx].id, enteredAt: now },
            ],
          };
          const col = newColumns[targetIdx];
          newColumns[targetIdx] = {
            ...col,
            cards: [restoredCard, ...col.cards],
            updatedAt: now,
          };
        }
        return {
          columns: newColumns,
          archive: prev.archive.filter((c) => !idsToRestore.has(c.id)),
        };
      });
    },
    [setState],
  );

  const permanentlyDeleteCard = useCallback<
    BoardContextValue["permanentlyDeleteCard"]
  >(
    (archivedCardId) => {
      setState((prev) => ({
        ...prev,
        archive: prev.archive.filter((c) => c.id !== archivedCardId),
      }));
    },
    [setState],
  );

  const permanentlyDeleteCards = useCallback<
    BoardContextValue["permanentlyDeleteCards"]
  >(
    (cardIds) => {
      const idsToDelete = new Set(cardIds);
      setState((prev) => ({
        ...prev,
        archive: prev.archive.filter((c) => !idsToDelete.has(c.id)),
      }));
    },
    [setState],
  );

  const clearArchive = useCallback<BoardContextValue["clearArchive"]>(() => {
    setState((prev) => ({ ...prev, archive: [] }));
  }, [setState]);

  return {
    archiveCard,
    restoreCard,
    restoreCards,
    permanentlyDeleteCard,
    permanentlyDeleteCards,
    clearArchive,
  };
}
