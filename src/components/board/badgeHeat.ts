type BadgeHeat = {
  accentPercent: number;
  bold: boolean;
};

export function getBadgeHeat(
  cardCount: number,
  index?: number,
  columnCount?: number,
): BadgeHeat | null {
  if (
    index === undefined ||
    columnCount === undefined ||
    index === 0 ||
    index === columnCount - 1 ||
    columnCount < 3
  ) {
    return null;
  }
  if (cardCount <= 2) return null;
  if (cardCount === 3) return { accentPercent: 10, bold: false };
  if (cardCount === 4) return { accentPercent: 18, bold: false };
  if (cardCount === 5) return { accentPercent: 25, bold: false };
  if (cardCount === 6) return { accentPercent: 33, bold: false };
  if (cardCount === 7) return { accentPercent: 42, bold: false };
  if (cardCount === 8) return { accentPercent: 50, bold: false };
  if (cardCount === 9) return { accentPercent: 58, bold: false };
  if (cardCount === 10) return { accentPercent: 65, bold: true };
  return { accentPercent: 75, bold: true };
}
