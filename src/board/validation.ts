import type { Card, Column } from "./types";

export function isCard(x: unknown): x is Card {
  return (
    !!x &&
    typeof x === "object" &&
    typeof (x as { id?: unknown }).id === "string" &&
    typeof (x as { title?: unknown }).title === "string"
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
