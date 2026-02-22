import type { Column } from "../board/types";

export type CardCycleTime = {
  cardTitle: string;
  cycleTimeMs: number;
};

/**
 * Get per-card cycle times for all cards that have moved between columns.
 * Returns an array sorted descending by cycle time.
 */
export function getCardCycleTimes(columns: Column[]): CardCycleTime[] {
  const results: CardCycleTime[] = [];

  for (const col of columns) {
    for (const card of col.cards) {
      if (card.columnHistory.length < 2) continue;
      const first = card.columnHistory[0];
      const last = card.columnHistory[card.columnHistory.length - 1];
      results.push({
        cardTitle: card.title,
        cycleTimeMs: last.enteredAt - first.enteredAt,
      });
    }
  }

  results.sort((a, b) => b.cycleTimeMs - a.cycleTimeMs);
  return results;
}

/**
 * Compute the average cycle time across all cards that have moved between columns.
 * Returns the average in milliseconds, or null if no qualifying cards exist.
 */
export function computeAverageCycleTime(columns: Column[]): number | null {
  const cycleTimes = getCardCycleTimes(columns);

  if (cycleTimes.length === 0) return null;

  return (
    cycleTimes.reduce((sum, ct) => sum + ct.cycleTimeMs, 0) /
    cycleTimes.length
  );
}

/**
 * Format a duration in milliseconds to a human-readable string.
 * Shows the two most significant non-zero units for readability.
 */
export function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1_000);
  const totalMinutes = Math.floor(totalSeconds / 60);
  const totalHours = Math.floor(totalMinutes / 60);
  const totalDays = Math.floor(totalHours / 24);

  const seconds = totalSeconds % 60;
  const minutes = totalMinutes % 60;
  const hours = totalHours % 24;

  if (totalDays > 0) {
    return hours > 0 ? `${totalDays}d ${hours}h` : `${totalDays}d`;
  }

  if (totalHours > 0) {
    return minutes > 0 ? `${totalHours}h ${minutes}m` : `${totalHours}h`;
  }

  if (totalMinutes > 0) {
    return seconds > 0 ? `${totalMinutes}m ${seconds}s` : `${totalMinutes}m`;
  }

  return `${totalSeconds}s`;
}
