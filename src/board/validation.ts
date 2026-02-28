import type { ArchivedCard, Card, Column } from "./types";

export function isCard(x: unknown): x is Card {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as { id?: unknown }).id === "string" &&
    typeof (x as { title?: unknown }).title === "string"
  );
}

export function isArchivedCard(x: unknown): x is ArchivedCard {
  return (
    isCard(x) &&
    typeof (x as { archivedAt?: unknown }).archivedAt === "number" &&
    typeof (x as { archivedFromColumnId?: unknown }).archivedFromColumnId ===
      "string"
  );
}

export function isColumn(x: unknown): x is Column {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as { id?: unknown }).id === "string" &&
    typeof (x as { title?: unknown }).title === "string" &&
    Array.isArray((x as { cards?: unknown }).cards) &&
    ((x as { cards?: unknown }).cards as unknown[]).every(isCard)
  );
}
