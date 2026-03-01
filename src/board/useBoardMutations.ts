import { useCallback, type RefObject } from "react";
import type {
  ArchivedCard,
  BoardContextValue,
  BoardState,
  Card,
} from "./types";
import { dropCardOnColumn } from "./dragUtils";

const defaultState: BoardState = {
  columns: [],
  archive: [],
};

export function useBoardMutations(
  setState: React.Dispatch<React.SetStateAction<BoardState>>,
  nextCardNumberRef: RefObject<number>,
  saveCounter: (n: number) => void,
) {
  const addColumn = useCallback<BoardContextValue["addColumn"]>(
    (title = "") => {
      const now = Date.now();
      const id = crypto.randomUUID();
      setState((s) => ({
        ...s,
        columns: [
          ...s.columns,
          { id, title, cards: [], createdAt: now, updatedAt: now },
        ],
      }));
    },
    [setState],
  );

  const updateColumn = useCallback<BoardContextValue["updateColumn"]>(
    (id, title) => {
      const now = Date.now();
      setState((s) => ({
        ...s,
        columns: s.columns.map((c) =>
          c.id === id ? { ...c, title, updatedAt: now } : c,
        ),
      }));
    },
    [setState],
  );

  const removeColumn = useCallback<BoardContextValue["removeColumn"]>(
    (id) => {
      setState((s) => {
        const col = s.columns.find((c) => c.id === id);
        const now = Date.now();
        const newArchived: ArchivedCard[] = (col?.cards ?? []).map((card) => ({
          ...card,
          archivedAt: now,
          archivedFromColumnId: id,
        }));
        return {
          ...s,
          columns: s.columns.filter((c) => c.id !== id),
          archive: [...s.archive, ...newArchived],
        };
      });
    },
    [setState],
  );

  const setColumns = useCallback<BoardContextValue["setColumns"]>(
    (cols, archive) => {
      setState((s) => ({
        ...s,
        columns: cols,
        ...(archive !== undefined ? { archive } : {}),
      }));
    },
    [setState],
  );

  const addCard = useCallback<BoardContextValue["addCard"]>(
    (columnId, title = "", ticketTypeId) => {
      const now = Date.now();
      const number = nextCardNumberRef.current;
      saveCounter(number + 1);
      const card: Card = {
        id: crypto.randomUUID(),
        number,
        title,
        description: "",
        ticketTypeId: ticketTypeId ?? null,
        createdAt: now,
        updatedAt: now,
        columnHistory: [{ columnId, enteredAt: now }],
      };
      setState((s) => ({
        ...s,
        columns: s.columns.map((c) =>
          c.id === columnId
            ? { ...c, cards: [card, ...c.cards], updatedAt: now }
            : c,
        ),
      }));
      return card.id;
    },
    [setState, nextCardNumberRef, saveCounter],
  );

  const removeCard = useCallback<BoardContextValue["removeCard"]>(
    (columnId, cardId) => {
      setState((prev) => {
        const idx = prev.columns.findIndex((c) => c.id === columnId);
        if (idx === -1) return prev;
        const col = prev.columns[idx];
        const newCards = col.cards.filter((c) => c.id !== cardId);
        if (newCards === col.cards) return prev;
        const now = Date.now();
        const newColumns = prev.columns.slice();
        newColumns[idx] = { ...col, cards: newCards, updatedAt: now };
        return { ...prev, columns: newColumns };
      });
    },
    [setState],
  );

  const updateCard = useCallback<BoardContextValue["updateCard"]>(
    (columnId, cardId, updates) => {
      setState((prev) => {
        const idx = prev.columns.findIndex((c) => c.id === columnId);
        if (idx === -1) return prev;
        const col = prev.columns[idx];
        const cardIdx = col.cards.findIndex((c) => c.id === cardId);
        if (cardIdx === -1) return prev;
        const now = Date.now();
        const newCards = col.cards.slice();
        newCards[cardIdx] = {
          ...newCards[cardIdx],
          ...updates,
          updatedAt: now,
        };
        const newColumns = prev.columns.slice();
        newColumns[idx] = { ...col, cards: newCards, updatedAt: now };
        return { ...prev, columns: newColumns };
      });
    },
    [setState],
  );

  const sortCards = useCallback<BoardContextValue["sortCards"]>(
    (columnId) => {
      setState((prev) => {
        const idx = prev.columns.findIndex((c) => c.id === columnId);
        if (idx === -1) return prev;
        const col = prev.columns[idx];
        const now = Date.now();
        const nextCards = col.cards
          .slice()
          .sort((a, b) =>
            a.title.localeCompare(b.title, undefined, { sensitivity: "base" }),
          );
        const nextColumns = prev.columns.slice();
        nextColumns[idx] = { ...col, cards: nextCards, updatedAt: now };
        return { ...prev, columns: nextColumns };
      });
    },
    [setState],
  );

  const reorderCard = useCallback<BoardContextValue["reorderCard"]>(
    (columnId, activeCardId, overCardId) => {
      setState((prev) => {
        const colIdx = prev.columns.findIndex((c) => c.id === columnId);
        if (colIdx === -1) return prev;
        const col = prev.columns[colIdx];
        const fromIdx = col.cards.findIndex((c) => c.id === activeCardId);
        const toIdx = col.cards.findIndex((c) => c.id === overCardId);
        if (fromIdx === -1 || toIdx === -1 || fromIdx === toIdx) return prev;
        const now = Date.now();
        const newCards = col.cards.slice();
        const [moved] = newCards.splice(fromIdx, 1);
        newCards.splice(toIdx, 0, { ...moved, updatedAt: now });
        const newColumns = prev.columns.slice();
        newColumns[colIdx] = { ...col, cards: newCards, updatedAt: now };
        return { ...prev, columns: newColumns };
      });
    },
    [setState],
  );

  const duplicateCard = useCallback<BoardContextValue["duplicateCard"]>(
    (columnId, source) => {
      const now = Date.now();
      const number = nextCardNumberRef.current;
      saveCounter(number + 1);
      const card: Card = {
        id: crypto.randomUUID(),
        number,
        title: source.title,
        description: source.description,
        ticketTypeId: source.ticketTypeId ?? null,
        createdAt: now,
        updatedAt: now,
        columnHistory: [{ columnId, enteredAt: now }],
      };
      setState((s) => ({
        ...s,
        columns: s.columns.map((c) =>
          c.id === columnId
            ? { ...c, cards: [card, ...c.cards], updatedAt: now }
            : c,
        ),
      }));
      return card.id;
    },
    [setState, nextCardNumberRef, saveCounter],
  );

  const moveCard = useCallback<BoardContextValue["moveCard"]>(
    (fromColumnId, toColumnId, cardId) => {
      if (fromColumnId === toColumnId) return;
      setState((prev) => ({
        ...prev,
        columns: dropCardOnColumn(
          prev.columns,
          fromColumnId,
          toColumnId,
          cardId,
        ),
      }));
    },
    [setState],
  );

  const renameTicketType = useCallback<BoardContextValue["renameTicketType"]>(
    (oldId, newId) => {
      setState((prev) => {
        const now = Date.now();
        const columns = prev.columns.map((col) => ({
          ...col,
          updatedAt: now,
          cards: col.cards.map((card) =>
            card.ticketTypeId === oldId
              ? { ...card, ticketTypeId: newId, updatedAt: now }
              : card,
          ),
        }));
        return { ...prev, columns };
      });
    },
    [setState],
  );

  const clearTicketType = useCallback<BoardContextValue["clearTicketType"]>(
    (typeId) => {
      setState((prev) => {
        const now = Date.now();
        const columns = prev.columns.map((col) => ({
          ...col,
          updatedAt: now,
          cards: col.cards.map((card) =>
            card.ticketTypeId === typeId
              ? { ...card, ticketTypeId: null, updatedAt: now }
              : card,
          ),
        }));
        return { ...prev, columns };
      });
    },
    [setState],
  );

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
        return {
          columns: newColumns,
          archive: [...prev.archive, archived],
        };
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
        // Strip archive metadata and add column history entry
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

  const resetBoard = useCallback<BoardContextValue["resetBoard"]>(() => {
    setState(defaultState);
  }, [setState]);

  return {
    addColumn,
    updateColumn,
    removeColumn,
    setColumns,
    addCard,
    removeCard,
    updateCard,
    duplicateCard,
    moveCard,
    sortCards,
    reorderCard,
    renameTicketType,
    clearTicketType,
    archiveCard,
    restoreCard,
    restoreCards,
    permanentlyDeleteCard,
    permanentlyDeleteCards,
    clearArchive,
    resetBoard,
  };
}
