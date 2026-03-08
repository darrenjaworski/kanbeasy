type CardFieldId =
  | "badge"
  | "title"
  | "description"
  | "checklist"
  | "dueDate"
  | "createdAt"
  | "updatedAt";

export type CardFieldConfig = Readonly<{
  id: CardFieldId;
  visible: boolean;
  options?: Readonly<{ lines?: number }>;
}>;

export type CardLayout = readonly CardFieldConfig[];

const CARD_FIELD_LABELS: Record<CardFieldId, string> = {
  badge: "Card Number",
  title: "Title",
  description: "Description",
  checklist: "Checklist Progress",
  dueDate: "Due Date",
  createdAt: "Created Date",
  updatedAt: "Updated Date",
};

export const DEFAULT_CARD_LAYOUT: CardLayout = [
  { id: "badge", visible: true },
  { id: "title", visible: true, options: { lines: 1 } },
  { id: "checklist", visible: true },
  { id: "dueDate", visible: true },
  { id: "description", visible: false, options: { lines: 2 } },
  { id: "createdAt", visible: false },
  { id: "updatedAt", visible: false },
];

const VALID_FIELD_IDS = new Set<string>(Object.keys(CARD_FIELD_LABELS));

function isFieldConfig(
  value: unknown,
): value is { id: string; visible: boolean; options?: { lines?: number } } {
  if (typeof value !== "object" || value === null) return false;
  const obj = value as Record<string, unknown>;
  if (typeof obj.id !== "string" || !VALID_FIELD_IDS.has(obj.id)) return false;
  if (typeof obj.visible !== "boolean") return false;

  if (obj.options !== undefined) {
    if (typeof obj.options !== "object" || obj.options === null) return false;
    const opts = obj.options as Record<string, unknown>;
    if (
      opts.lines !== undefined &&
      (typeof opts.lines !== "number" || opts.lines < 1 || opts.lines > 3)
    )
      return false;
  }

  return true;
}

export function isValidCardLayout(value: unknown): value is CardLayout {
  if (!Array.isArray(value) || value.length === 0) return false;

  const seenIds = new Set<string>();
  for (const field of value) {
    if (!isFieldConfig(field)) return false;
    if (seenIds.has(field.id)) return false;
    seenIds.add(field.id);
  }

  // Every known field must be present
  return VALID_FIELD_IDS.size === seenIds.size;
}
