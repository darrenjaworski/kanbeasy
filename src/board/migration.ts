import type { ArchivedCard, Card, Column, ColumnHistoryEntry } from "./types";
import type { CardType } from "../constants/cardTypes";
import { CARD_TYPE_PRESETS } from "../constants/cardTypes";
import { kvGet } from "../utils/db";
import { STORAGE_KEYS } from "../constants/storage";

/**
 * Builds a lookup map of card type ID → CardType from the user's saved
 * types (db cache) and all built-in presets as fallback.
 */
function buildCardTypeLookup(): Map<string, CardType> {
  const map = new Map<string, CardType>();

  // Add all preset types first (lower priority)
  for (const preset of CARD_TYPE_PRESETS) {
    for (const t of preset.types) {
      map.set(t.id, t);
    }
  }

  // Override with user's saved types (higher priority)
  const saved = kvGet<CardType[] | null>(STORAGE_KEYS.CARD_TYPES, null);
  if (Array.isArray(saved)) {
    for (const t of saved) {
      if (
        t &&
        typeof t === "object" &&
        typeof t.id === "string" &&
        typeof t.label === "string" &&
        typeof t.color === "string"
      ) {
        map.set(t.id, t);
      }
    }
  }

  return map;
}

// Lazily built on first use during a migration pass
let cardTypeLookup: Map<string, CardType> | null = null;

function getCardTypeLookup(): Map<string, CardType> {
  if (!cardTypeLookup) {
    cardTypeLookup = buildCardTypeLookup();
  }
  return cardTypeLookup;
}

/** Reset the cached lookup (used by tests after storage changes). */
export function resetCardTypeLookup(): void {
  cardTypeLookup = null;
}

/**
 * Backfills timestamps and columnHistory on a legacy card.
 * Idempotent — preserves existing values if already present.
 * Backfills cardTypeLabel/cardTypeColor from known types when missing.
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
  // Support both new (cardTypeId) and legacy (ticketTypeId) field names
  const rawCardTypeId = raw.cardTypeId ?? raw.ticketTypeId;
  const cardTypeId = typeof rawCardTypeId === "string" ? rawCardTypeId : null;
  const dueDate = typeof raw.dueDate === "string" ? raw.dueDate : null;

  // Backfill snapshot fields from known card types when missing
  // Support both new (cardType*) and legacy (ticketType*) field names
  const rawLabel = raw.cardTypeLabel ?? raw.ticketTypeLabel;
  const rawColor = raw.cardTypeColor ?? raw.ticketTypeColor;
  let cardTypeLabel = typeof rawLabel === "string" ? rawLabel : undefined;
  let cardTypeColor = typeof rawColor === "string" ? rawColor : undefined;

  if (cardTypeId && (!cardTypeLabel || !cardTypeColor)) {
    const knownType = getCardTypeLookup().get(cardTypeId);
    if (knownType) {
      cardTypeLabel ??= knownType.label;
      cardTypeColor ??= knownType.color;
    }
  }

  return {
    id: raw.id as string,
    number,
    title: raw.title as string,
    description,
    cardTypeId,
    ...(cardTypeLabel && { cardTypeLabel }),
    ...(cardTypeColor && { cardTypeColor }),
    dueDate,
    createdAt,
    updatedAt,
    columnHistory,
  };
}

/**
 * Migrates an archived card, backfilling card fields and archive-specific fields.
 * Idempotent — preserves existing values if already present.
 */
function migrateArchivedCard(raw: Record<string, unknown>): ArchivedCard {
  const columnId =
    typeof raw.archivedFromColumnId === "string"
      ? raw.archivedFromColumnId
      : "unknown";
  const card = migrateCard(raw, columnId);
  const now = Date.now();

  return {
    ...card,
    archivedAt: typeof raw.archivedAt === "number" ? raw.archivedAt : now,
    archivedFromColumnId: columnId,
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
 * Archived cards are included in the used-numbers set to avoid conflicts.
 * Returns the migrated columns and the next available card number.
 */
export function migrateColumnsWithNumbering(
  rawColumns: Record<string, unknown>[],
  rawArchive: Record<string, unknown>[] = [],
): { columns: Column[]; archive: ArchivedCard[]; nextCardNumber: number } {
  const columns = migrateColumns(rawColumns);
  const archive = rawArchive.map(migrateArchivedCard);

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
  // Include archive card numbers to avoid collisions
  const usedNumbers = new Set<number>();
  for (const entry of entries) {
    if (entry.card.number > 0) {
      usedNumbers.add(entry.card.number);
    }
  }
  for (const archivedCard of archive) {
    if (archivedCard.number > 0) {
      usedNumbers.add(archivedCard.number);
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

  // Next card number is max of all assigned/used numbers + 1
  let maxNumber = 0;
  for (const n of usedNumbers) {
    if (n > maxNumber) maxNumber = n;
  }
  for (const n of numberMap.values()) {
    if (n > maxNumber) maxNumber = n;
  }

  return {
    columns: numberedColumns,
    archive,
    nextCardNumber: Math.max(maxNumber + 1, 1),
  };
}
