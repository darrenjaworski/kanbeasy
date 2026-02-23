import { useTheme } from "../theme/useTheme";
import { BoardViewIcon, ListViewIcon } from "./icons";
import { tc } from "../theme/classNames";
import type { ViewMode } from "../theme/types";

const modes: readonly {
  mode: ViewMode;
  label: string;
  Icon: typeof BoardViewIcon;
}[] = [
  { mode: "board", label: "Board view", Icon: BoardViewIcon },
  { mode: "list", label: "List view", Icon: ListViewIcon },
];

export function ViewToggle() {
  const { viewMode, setViewMode } = useTheme();

  return (
    <div
      className={`${tc.buttonGroup} rounded-md`}
      role="radiogroup"
      aria-label="View mode"
    >
      {modes.map(({ mode, label, Icon }) => {
        const active = viewMode === mode;
        return (
          <button
            key={mode}
            type="button"
            role="radio"
            aria-checked={active}
            aria-label={label}
            className={`p-1.5 transition-colors ${tc.focusRing} ${active ? tc.pressed : tc.bgHover}`}
            onClick={() => setViewMode(mode)}
          >
            <Icon className="size-4" />
          </button>
        );
      })}
    </div>
  );
}
