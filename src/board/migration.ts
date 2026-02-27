import type { Card, Column, ColumnHistoryEntry } from "./types";

/**
 * Backfills timestamps and columnHistory on a legacy card.
 * Idempotent — preserves existing values if already present.
 */
export function migrateCard(
  raw: Record<string, unknown>,
  columnId: string,
): Card {
  const now = Date.now();

  const description =
    typeof raw.description === "string" ? raw.description : "";
  const createdAt = typeof raw.createdAt === "number" ? raw.createdAt : now;
  const updatedAt = typeof raw.updatedAt === "number" ? raw.updatedAt : now;
  const columnHistory = Array.isArray(raw.columnHistory)
    ? (raw.columnHistory as ColumnHistoryEntry[])
    : [{ columnId, enteredAt: now }];

  const number = typeof raw.number === "number" ? raw.number : 0;
  const ticketTypeId =
    typeof raw.ticketTypeId === "string" ? raw.ticketTypeId : null;

  return {
    id: raw.id as string,
    number,
    title: raw.title as string,
    description,
    ticketTypeId,
    createdAt,
    updatedAt,
    columnHistory,
  };
}

/**
 * Backfills timestamps on a legacy column and migrates all child cards.
 * Idempotent — preserves existing values if already present.
 */
export function migrateColumn(raw: Record<string, unknown>): Column {
  const now = Date.now();

  const createdAt = typeof raw.createdAt === "number" ? raw.createdAt : now;
  const updatedAt = typeof raw.updatedAt === "number" ? raw.updatedAt : now;

  const columnId = raw.id as string;
  const rawCards = Array.isArray(raw.cards)
    ? (raw.cards as Record<string, unknown>[])
    : [];

  return {
    id: columnId,
    title: raw.title as string,
    cards: rawCards.map((c) => migrateCard(c, columnId)),
    createdAt,
    updatedAt,
  };
}

/**
 * Migrates an array of columns, backfilling timestamps on all columns and cards.
 */
export function migrateColumns(columns: Record<string, unknown>[]): Column[] {
  return columns.map(migrateColumn);
}

/**
 * Migrates columns and assigns sequential card numbers by createdAt order.
 * Cards that already have a number > 0 keep their existing number.
 * Returns the migrated columns and the next available card number.
 */
export function migrateColumnsWithNumbering(
  rawColumns: Record<string, unknown>[],
): { columns: Column[]; nextCardNumber: number } {
  const columns = migrateColumns(rawColumns);

  // Collect all cards with their position info for stable sorting
  const entries: { colIdx: number; cardIdx: number; card: Card }[] = [];
  for (let ci = 0; ci < columns.length; ci++) {
    for (let cdi = 0; cdi < columns[ci].cards.length; cdi++) {
      entries.push({ colIdx: ci, cardIdx: cdi, card: columns[ci].cards[cdi] });
    }
  }

  // Sort by createdAt, then column index, then card index (for stable tie-breaking)
  entries.sort((a, b) => {
    if (a.card.createdAt !== b.card.createdAt)
      return a.card.createdAt - b.card.createdAt;
    if (a.colIdx !== b.colIdx) return a.colIdx - b.colIdx;
    return a.cardIdx - b.cardIdx;
  });

  // Collect existing numbers into a Set for O(1) conflict checks
  const usedNumbers = new Set<number>();
  for (const entry of entries) {
    if (entry.card.number > 0) {
      usedNumbers.add(entry.card.number);
    }
  }

  // Build a map of card id → assigned number
  const numberMap = new Map<string, number>();
  let counter = 1;
  for (const entry of entries) {
    if (entry.card.number > 0) {
      numberMap.set(entry.card.id, entry.card.number);
    } else {
      // Find the next available number that doesn't conflict
      while (usedNumbers.has(counter)) {
        counter++;
      }
      numberMap.set(entry.card.id, counter);
      usedNumbers.add(counter);
      counter++;
    }
  }

  // Rebuild columns with assigned numbers
  const numberedColumns = columns.map((col) => ({
    ...col,
    cards: col.cards.map((card) => ({
      ...card,
      number: numberMap.get(card.id) ?? card.number,
    })),
  }));

  // Next card number is max of all assigned numbers + 1
  let maxNumber = 0;
  for (const n of numberMap.values()) {
    if (n > maxNumber) maxNumber = n;
  }

  return {
    columns: numberedColumns,
    nextCardNumber: Math.max(maxNumber + 1, 1),
  };
}
