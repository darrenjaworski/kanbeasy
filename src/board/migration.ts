import type { Card, Column, ColumnHistoryEntry } from "./types";

/**
 * Backfills timestamps and columnHistory on a legacy card.
 * Idempotent — preserves existing values if already present.
 */
export function migrateCard(
  raw: Record<string, unknown>,
  columnId: string
): Card {
  const now = Date.now();

  const createdAt =
    typeof raw.createdAt === "number" ? raw.createdAt : now;
  const updatedAt =
    typeof raw.updatedAt === "number" ? raw.updatedAt : now;
  const columnHistory = Array.isArray(raw.columnHistory)
    ? (raw.columnHistory as ColumnHistoryEntry[])
    : [{ columnId, enteredAt: now }];

  return {
    id: raw.id as string,
    title: raw.title as string,
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

  const createdAt =
    typeof raw.createdAt === "number" ? raw.createdAt : now;
  const updatedAt =
    typeof raw.updatedAt === "number" ? raw.updatedAt : now;

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
