const CHECKBOX_PATTERN = /^[ \t]*[-*+]\s+\[([ xX])\]/gm;

type ChecklistStats = { total: number; checked: number };

export function getChecklistStats(markdown: string): ChecklistStats | null {
  let total = 0;
  let checked = 0;
  let match;
  while ((match = CHECKBOX_PATTERN.exec(markdown)) !== null) {
    total++;
    if (match[1] !== " ") checked++;
  }
  CHECKBOX_PATTERN.lastIndex = 0;
  return total > 0 ? { total, checked } : null;
}
