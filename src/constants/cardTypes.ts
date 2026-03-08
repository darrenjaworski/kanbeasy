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

/** 12 fixed colors that work in both light and dark mode. */
export const CARD_TYPE_COLORS = [
  "#6366f1", // indigo
  "#22c55e", // green
  "#f59e0b", // amber
  "#ef4444", // red
  "#8b5cf6", // violet
  "#06b6d4", // cyan
  "#ec4899", // pink
  "#64748b", // slate
  "#f97316", // orange
  "#14b8a6", // teal
  "#a855f7", // purple
  "#84cc16", // lime
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
      { id: "docs", label: "Docs", color: "#06b6d4" },
      { id: "style", label: "Style", color: "#ec4899" },
      { id: "ci", label: "CI", color: "#8b5cf6" },
      { id: "build", label: "Build", color: "#f97316" },
      { id: "perf", label: "Perf", color: "#14b8a6" },
      { id: "revert", label: "Revert", color: "#a855f7" },
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
