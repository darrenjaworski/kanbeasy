import type { Column } from "../board/types";

type CardReverseTime = {
  cardTitle: string;
  reverseTimeMs: number;
};

/**
 * Total number of cards across all columns.
 */
export function getTotalCards(columns: Column[]): number {
  return columns.reduce((sum, col) => sum + col.cards.length, 0);
}

/**
 * Count of cards in "middle" columns (not first or last).
 * Returns 0 when there are fewer than 3 columns.
 */
export function getCardsInFlight(columns: Column[]): number {
  if (columns.length < 3) return 0;
  return columns
    .slice(1, columns.length - 1)
    .reduce((sum, col) => sum + col.cards.length, 0);
}

/**
 * Count of cards completed (in the final column) within the last 7 and 30 days.
 * A card counts if its last columnHistory entry references the final column
 * and its enteredAt is within the time window.
 */
export function getThroughput(
  columns: Column[],
  now: number = Date.now(),
): { last7Days: number; last30Days: number } {
  if (columns.length === 0) return { last7Days: 0, last30Days: 0 };

  const finalColumn = columns[columns.length - 1];
  const ms7Days = 7 * 24 * 60 * 60 * 1000;
  const ms30Days = 30 * 24 * 60 * 60 * 1000;

  let last7Days = 0;
  let last30Days = 0;

  for (const card of finalColumn.cards) {
    if (card.columnHistory.length === 0) continue;
    const lastEntry = card.columnHistory[card.columnHistory.length - 1];
    if (lastEntry.columnId !== finalColumn.id) continue;

    const age = now - lastEntry.enteredAt;
    if (age <= ms30Days) {
      last30Days++;
      if (age <= ms7Days) {
        last7Days++;
      }
    }
  }

  return { last7Days, last30Days };
}

/**
 * For each card that has moved backwards (to a lower-indexed column),
 * compute the total time spent in reverse positions.
 * Returns cards sorted descending by reverse time.
 */
export function getCardReverseTimes(
  columns: Column[],
  now: number = Date.now(),
): CardReverseTime[] {
  const columnIndexMap = new Map<string, number>();
  for (let i = 0; i < columns.length; i++) {
    columnIndexMap.set(columns[i].id, i);
  }

  const results: CardReverseTime[] = [];

  for (const col of columns) {
    for (const card of col.cards) {
      if (card.columnHistory.length < 2) continue;

      let reverseTimeMs = 0;

      for (let i = 0; i < card.columnHistory.length - 1; i++) {
        const fromIndex = columnIndexMap.get(card.columnHistory[i].columnId);
        const toIndex = columnIndexMap.get(card.columnHistory[i + 1].columnId);

        if (fromIndex === undefined || toIndex === undefined) continue;

        if (toIndex < fromIndex) {
          // This is a backward move. Accumulate time spent in the reverse position.
          const enteredReverse = card.columnHistory[i + 1].enteredAt;
          const exitedReverse =
            i + 2 < card.columnHistory.length
              ? card.columnHistory[i + 2].enteredAt
              : now;
          reverseTimeMs += exitedReverse - enteredReverse;
        }
      }

      if (reverseTimeMs > 0) {
        results.push({ cardTitle: card.title, reverseTimeMs });
      }
    }
  }

  results.sort((a, b) => b.reverseTimeMs - a.reverseTimeMs);
  return results;
}

/**
 * Average reverse time across all cards that have moved backwards.
 * Returns null if no cards have reverse time.
 */
export function computeAverageReverseTime(
  columns: Column[],
  now: number = Date.now(),
): number | null {
  const reverseTimes = getCardReverseTimes(columns, now);
  if (reverseTimes.length === 0) return null;

  return (
    reverseTimes.reduce((sum, rt) => sum + rt.reverseTimeMs, 0) /
    reverseTimes.length
  );
}
