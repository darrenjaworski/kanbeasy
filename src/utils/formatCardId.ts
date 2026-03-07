import type { CardType } from "../constants/cardTypes";

/**
 * Look up a card type by ID.
 * Returns undefined if not found (orphaned/deleted type).
 */
export function findCardType(
  types: CardType[],
  id: string | null,
): CardType | undefined {
  if (!id) return undefined;
  return types.find((t) => t.id === id);
}

/**
 * Format a card's display ID.
 * With a card type: "feat-42"
 * Without: "#42"
 */
export function formatCardId(
  number: number,
  cardTypeId: string | null,
  types: CardType[],
): string {
  const type = findCardType(types, cardTypeId);
  if (type) return `${type.id}-${number}`;
  return `#${number}`;
}
