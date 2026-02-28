/** Returns `true` when the local hour is between 10 PM and 4 AM (inclusive of 22, exclusive of 4). */
export function isNightOwlHour(now: Date = new Date()): boolean {
  const hour = now.getHours();
  return hour >= 22 || hour < 4;
}
