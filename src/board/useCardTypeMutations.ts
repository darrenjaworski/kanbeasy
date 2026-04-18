import { useCallback } from "react";
import type { BoardContextValue, BoardState } from "./types";

export function useCardTypeMutations(
  setState: React.Dispatch<React.SetStateAction<BoardState>>,
) {
  const renameCardType = useCallback<BoardContextValue["renameCardType"]>(
    (oldId, newId) => {
      setState((prev) => {
        const hasAffectedCard = prev.columns.some((col) =>
          col.cards.some((card) => card.cardTypeId === oldId),
        );
        if (!hasAffectedCard) return prev;
        const now = Date.now();
        const columns = prev.columns.map((col) => {
          if (!col.cards.some((card) => card.cardTypeId === oldId)) return col;
          return {
            ...col,
            updatedAt: now,
            cards: col.cards.map((card) =>
              card.cardTypeId === oldId
                ? { ...card, cardTypeId: newId, updatedAt: now }
                : card,
            ),
          };
        });
        return { ...prev, columns };
      });
    },
    [setState],
  );

  const clearCardType = useCallback<BoardContextValue["clearCardType"]>(
    (typeId) => {
      setState((prev) => {
        const hasAffectedCard = prev.columns.some((col) =>
          col.cards.some((card) => card.cardTypeId === typeId),
        );
        if (!hasAffectedCard) return prev;
        const now = Date.now();
        const columns = prev.columns.map((col) => {
          if (!col.cards.some((card) => card.cardTypeId === typeId)) return col;
          return {
            ...col,
            updatedAt: now,
            cards: col.cards.map((card) =>
              card.cardTypeId === typeId
                ? { ...card, cardTypeId: null, updatedAt: now }
                : card,
            ),
          };
        });
        return { ...prev, columns };
      });
    },
    [setState],
  );

  return { renameCardType, clearCardType };
}
