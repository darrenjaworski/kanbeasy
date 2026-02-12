import { arrayMove } from "@dnd-kit/sortable";
import type { Card, Column } from "./types";

/**
 * Finds the index of a column by its ID.
 * @returns The column index, or -1 if not found
 */
export function findColumnIndex(columns: Column[], columnId: string): number {
  return columns.findIndex((c) => c.id === columnId);
}

/**
 * Finds the index of a card within a cards array by its ID.
 * @returns The card index, or -1 if not found
 */
export function findCardIndex(cards: Card[], cardId: string): number {
  return cards.findIndex((c) => c.id === cardId);
}

/**
 * Finds a card across all columns by its ID.
 * @returns The card object, or null if not found
 */
export function findCardInColumns(
  columns: Column[],
  cardId: string
): Card | null {
  for (const col of columns) {
    const found = col.cards.find((c) => c.id === cardId);
    if (found) return found;
  }
  return null;
}

/**
 * Reorders columns by moving a column from one position to another.
 * @returns A new columns array with the reordered columns
 */
export function reorderColumns(
  columns: Column[],
  activeId: string,
  overId: string
): Column[] {
  const oldIndex = findColumnIndex(columns, activeId);
  const newIndex = findColumnIndex(columns, overId);

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return columns;
  }

  return arrayMove(columns, oldIndex, newIndex);
}

/**
 * Moves a card within the same column (reordering).
 * @returns A new columns array with the card reordered within its column
 */
export function moveCardWithinColumn(
  columns: Column[],
  columnId: string,
  activeCardId: string,
  overCardId: string
): Column[] {
  const colIdx = findColumnIndex(columns, columnId);
  if (colIdx === -1) return columns;

  const col = columns[colIdx];
  const oldIndex = findCardIndex(col.cards, activeCardId);
  const newIndex = findCardIndex(col.cards, overCardId);

  if (oldIndex === -1 || newIndex === -1 || oldIndex === newIndex) {
    return columns;
  }

  const reordered = arrayMove(col.cards, oldIndex, newIndex);
  const next = columns.slice();
  next[colIdx] = { ...col, cards: reordered };

  return next;
}

/**
 * Moves a card from one column to another, inserting it at a specific position.
 * @returns A new columns array with the card moved between columns
 */
export function moveCardAcrossColumns(
  columns: Column[],
  fromColId: string,
  toColId: string,
  activeCardId: string,
  overCardId: string
): Column[] {
  const fromIdx = findColumnIndex(columns, fromColId);
  const toIdx = findColumnIndex(columns, toColId);

  if (fromIdx === -1 || toIdx === -1) return columns;

  const fromCol = columns[fromIdx];
  const toCol = columns[toIdx];
  const cardIdx = findCardIndex(fromCol.cards, activeCardId);

  if (cardIdx === -1) return columns;

  const moved = fromCol.cards[cardIdx];
  const nextFromCards = fromCol.cards.slice();
  nextFromCards.splice(cardIdx, 1);

  const overIdx = findCardIndex(toCol.cards, overCardId);
  const insertAt = overIdx === -1 ? toCol.cards.length : overIdx;
  const nextToCards = toCol.cards.slice();
  nextToCards.splice(insertAt, 0, moved);

  const next = columns.slice();
  next[fromIdx] = { ...fromCol, cards: nextFromCards };
  next[toIdx] = { ...toCol, cards: nextToCards };

  return next;
}

/**
 * Drops a card onto a column area, moving it to the beginning of the target column.
 * If dropped in the same column, moves the card to the end.
 * @returns A new columns array with the card moved
 */
export function dropCardOnColumn(
  columns: Column[],
  fromColId: string,
  toColId: string,
  activeCardId: string
): Column[] {
  const fromIdx = findColumnIndex(columns, fromColId);
  const toIdx = findColumnIndex(columns, toColId);

  if (fromIdx === -1 || toIdx === -1) return columns;

  // Same column: move to end
  if (fromIdx === toIdx) {
    const col = columns[fromIdx];
    const oldIndex = findCardIndex(col.cards, activeCardId);
    if (oldIndex === -1) return columns;

    const reordered = arrayMove(col.cards, oldIndex, col.cards.length - 1);
    const next = columns.slice();
    next[fromIdx] = { ...col, cards: reordered };
    return next;
  }

  // Different columns: move to beginning of target column
  const fromCol = columns[fromIdx];
  const toCol = columns[toIdx];
  const cardIdx = findCardIndex(fromCol.cards, activeCardId);

  if (cardIdx === -1) return columns;

  const moved = fromCol.cards[cardIdx];
  const nextFromCards = fromCol.cards.slice();
  nextFromCards.splice(cardIdx, 1);

  const nextToCards = toCol.cards.slice();
  nextToCards.unshift(moved);

  const next = columns.slice();
  next[fromIdx] = { ...fromCol, cards: nextFromCards };
  next[toIdx] = { ...toCol, cards: nextToCards };

  return next;
}
