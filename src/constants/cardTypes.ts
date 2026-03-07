export type CardType = Readonly<{
  id: string;
  label: string;
  color: string;
}>;

type CardTypePreset = Readonly<{
  id: string;
  name: string;
  types: CardType[];
}>;

/** 8 fixed colors that work in both light and dark mode. */
export const CARD_TYPE_COLORS = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#64748b", // slate
] as const;

export const CARD_TYPE_PRESETS: CardTypePreset[] = [
  {
    id: "development",
    name: "Development",
    types: [
      { id: "feat", label: "Feature", color: "#22c55e" },
      { id: "fix", label: "Fix", color: "#ef4444" },
      { id: "refactor", label: "Refactor", color: "#6366f1" },
      { id: "chore", label: "Chore", color: "#64748b" },
      { id: "test", label: "Test", color: "#f59e0b" },
    ],
  },
  {
    id: "personal",
    name: "Personal",
    types: [
      { id: "task", label: "Task", color: "#6366f1" },
      { id: "idea", label: "Idea", color: "#f59e0b" },
      { id: "errand", label: "Errand", color: "#22c55e" },
      { id: "goal", label: "Goal", color: "#8b5cf6" },
    ],
  },
];

export const DEFAULT_PRESET_ID = "development";
