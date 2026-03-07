import { useTheme } from "../theme/useTheme";
import { useBoard } from "../board/useBoard";
import { BoardViewIcon, CalendarIcon, ListViewIcon } from "./icons";
import { tc } from "../theme/classNames";
import type { ViewMode } from "../theme/types";

const modes: readonly {
  mode: ViewMode;
  label: string;
  shortLabel: string;
  Icon: typeof BoardViewIcon;
}[] = [
  {
    mode: "board",
    label: "Board view",
    shortLabel: "Board",
    Icon: BoardViewIcon,
  },
  { mode: "list", label: "List view", shortLabel: "List", Icon: ListViewIcon },
  {
    mode: "calendar",
    label: "Calendar view",
    shortLabel: "Calendar",
    Icon: CalendarIcon,
  },
];

export function ViewToggle() {
  const { viewMode, setViewMode, compactHeader } = useTheme();
  const { columns } = useBoard();
  const hasCards = columns.some((c) => c.cards.length > 0);
  const hasDueDates = columns.some((c) =>
    c.cards.some((card) => card.dueDate),
  );

  return (
    <div
      className={`${tc.buttonGroup} rounded-md`}
      role="radiogroup"
      aria-label="View mode"
    >
      {modes.map(({ mode, label, shortLabel, Icon }) => {
        const active = viewMode === mode;
        const disabled =
          mode === "calendar"
            ? !hasDueDates
            : mode !== "board" && !hasCards;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            disabled={disabled}
            className={`p-1.5 px-2.5 inline-flex items-center gap-1.5 transition-colors ${tc.focusRing} ${active ? tc.pressed : tc.bgHover} disabled:opacity-40 disabled:pointer-events-none`}
            onClick={() => setViewMode(mode)}
          >
            <Icon className="size-4" />
            {!compactHeader && (
              <span className="text-xs font-medium">{shortLabel}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}
