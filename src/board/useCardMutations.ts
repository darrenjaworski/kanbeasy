import { useCallback, type RefObject } from "react";
import type {
  BoardContextValue,
  BoardState,
  Card,
  CardClipboard,
} from "./types";
import { dropCardOnColumn } from "./dragUtils";

export function useCardMutations(
  setState: React.Dispatch<React.SetStateAction<BoardState>>,
  nextCardNumberRef: RefObject<number>,
  saveCounter: (n: number) => void,
) {
  const addCard = useCallback<BoardContextValue["addCard"]>(
    (columnId, title = "", cardTypeId, cardTypeLabel, cardTypeColor) => {
      const now = Date.now();
      const number = nextCardNumberRef.current;
      saveCounter(number + 1);
      const card: Card = {
        id: crypto.randomUUID(),
        number,
        title,
        description: "",
        cardTypeId: cardTypeId ?? null,
        ...(cardTypeLabel !== undefined && { cardTypeLabel }),
        ...(cardTypeColor !== undefined && { cardTypeColor }),
        dueDate: null,
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
        if (!col.cards.some((c) => c.id === cardId)) return prev;
        const newCards = col.cards.filter((c) => c.id !== cardId);
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
    (columnId, source: CardClipboard) => {
      const now = Date.now();
      const number = nextCardNumberRef.current;
      saveCounter(number + 1);
      const card: Card = {
        id: crypto.randomUUID(),
        number,
        title: source.title,
        description: source.description,
        cardTypeId: source.cardTypeId ?? null,
        ...(source.cardTypeLabel !== undefined && {
          cardTypeLabel: source.cardTypeLabel,
        }),
        ...(source.cardTypeColor !== undefined && {
          cardTypeColor: source.cardTypeColor,
        }),
        dueDate: source.dueDate ?? null,
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

  return {
    addCard,
    removeCard,
    updateCard,
    sortCards,
    reorderCard,
    duplicateCard,
    moveCard,
  };
}
