import type { ArchivedCard, Card, Column, ColumnHistoryEntry } from "./types";
import type { TicketType } from "../constants/ticketTypes";
import { TICKET_TYPE_PRESETS } from "../constants/ticketTypes";

/**
 * Builds a lookup map of ticket type ID → TicketType from the user's saved
 * types (localStorage) and all built-in presets as fallback.
 */
function buildTicketTypeLookup(): Map<string, TicketType> {
  const map = new Map<string, TicketType>();

  // Add all preset types first (lower priority)
  for (const preset of TICKET_TYPE_PRESETS) {
    for (const t of preset.types) {
      map.set(t.id, t);
    }
  }

  // Override with user's saved types (higher priority)
  try {
    const raw = window.localStorage.getItem("kanbeasy:ticketTypes");
    if (raw) {
      const parsed = JSON.parse(raw) as unknown;
      if (Array.isArray(parsed)) {
        for (const t of parsed) {
          if (
            t &&
            typeof t === "object" &&
            typeof (t as TicketType).id === "string" &&
            typeof (t as TicketType).label === "string" &&
            typeof (t as TicketType).color === "string"
          ) {
            map.set((t as TicketType).id, t as TicketType);
          }
        }
      }
    }
  } catch {
    // Ignore parse errors — fall back to presets only
  }

  return map;
}

// Lazily built on first use during a migration pass
let ticketTypeLookup: Map<string, TicketType> | null = null;

function getTicketTypeLookup(): Map<string, TicketType> {
  if (!ticketTypeLookup) {
    ticketTypeLookup = buildTicketTypeLookup();
  }
  return ticketTypeLookup;
}

/** Reset the cached lookup (used by tests after localStorage changes). */
export function resetTicketTypeLookup(): void {
  ticketTypeLookup = null;
}

/**
 * Backfills timestamps and columnHistory on a legacy card.
 * Idempotent — preserves existing values if already present.
 * Backfills ticketTypeLabel/ticketTypeColor from known types when missing.
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
  const dueDate = typeof raw.dueDate === "string" ? raw.dueDate : null;

  // Backfill snapshot fields from known ticket types when missing
  let ticketTypeLabel =
    typeof raw.ticketTypeLabel === "string" ? raw.ticketTypeLabel : undefined;
  let ticketTypeColor =
    typeof raw.ticketTypeColor === "string" ? raw.ticketTypeColor : undefined;

  if (ticketTypeId && (!ticketTypeLabel || !ticketTypeColor)) {
    const knownType = getTicketTypeLookup().get(ticketTypeId);
    if (knownType) {
      ticketTypeLabel ??= knownType.label;
      ticketTypeColor ??= knownType.color;
    }
  }

  return {
    id: raw.id as string,
    number,
    title: raw.title as string,
    description,
    ticketTypeId,
    ...(ticketTypeLabel && { ticketTypeLabel }),
    ...(ticketTypeColor && { ticketTypeColor }),
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
