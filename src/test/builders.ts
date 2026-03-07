import type { Card, Column, ArchivedCard } from "../board/types";

let autoNumber = 0;

/**
 * Reset the auto-incrementing card number counter.
 * Call in `beforeEach` when tests depend on specific card numbers.
 */
export function resetCardNumber(start = 0): void {
  autoNumber = start;
}

/**
 * Build a Card with sensible defaults. Every field can be overridden.
 *
 * @example
 *   makeCard({ id: "c1", title: "Buy milk" })
 *   makeCard({ id: "c2", dueDate: "2025-06-15", columnHistory: [{ columnId: "col-1", enteredAt: 1000 }] })
 */
export function makeCard(overrides: Partial<Card> & { id: string }): Card {
  return {
    number: ++autoNumber,
    title: "",
    description: "",
    cardTypeId: null,
    dueDate: null,
    createdAt: 0,
    updatedAt: 0,
    columnHistory: [],
    ...overrides,
  };
}

/**
 * Build a Column with sensible defaults.
 *
 * @example
 *   makeColumn({ id: "col-1", title: "To Do", cards: [card1, card2] })
 *   makeColumn({ id: "col-2" })  // empty column with blank title
 */
export function makeColumn(
  overrides: Partial<Column> & { id: string },
): Column {
  return {
    title: "",
    cards: [],
    createdAt: 0,
    updatedAt: 0,
    ...overrides,
  };
}

/**
 * Build an ArchivedCard with sensible defaults.
 *
 * @example
 *   makeArchivedCard({ id: "a1", title: "Done task", archivedFromColumnId: "col-2" })
 */
export function makeArchivedCard(
  overrides: Partial<ArchivedCard> & { id: string },
): ArchivedCard {
  return {
    number: ++autoNumber,
    title: "",
    description: "",
    cardTypeId: null,
    dueDate: null,
    createdAt: 0,
    updatedAt: 0,
    columnHistory: [],
    archivedAt: 0,
    archivedFromColumnId: "col-1",
    ...overrides,
  };
}
