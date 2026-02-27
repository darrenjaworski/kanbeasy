import type { TicketType } from "../constants/ticketTypes";

/**
 * Look up a ticket type by ID.
 * Returns undefined if not found (orphaned/deleted type).
 */
export function findTicketType(
  types: TicketType[],
  id: string | null,
): TicketType | undefined {
  if (!id) return undefined;
  return types.find((t) => t.id === id);
}

/**
 * Format a card's display ID.
 * With a ticket type: "feat-42"
 * Without: "#42"
 */
export function formatCardId(
  number: number,
  ticketTypeId: string | null,
  types: TicketType[],
): string {
  const type = findTicketType(types, ticketTypeId);
  if (type) return `${type.id}-${number}`;
  return `#${number}`;
}
