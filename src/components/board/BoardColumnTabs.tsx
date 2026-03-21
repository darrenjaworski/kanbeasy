import type { Column } from "../../board/types";
import { tc } from "../../theme/classNames";

interface Props {
  columns: Column[];
  activeIndex: number;
  onTabClick: (index: number) => void;
  onAddColumn: () => void;
}

export function BoardColumnTabs({
  columns,
  activeIndex,
  onTabClick,
  onAddColumn,
}: Props) {
  return (
    <div
      className="flex items-center gap-2 overflow-x-auto px-3 pt-4 pb-2"
      role="tablist"
      aria-label="Column navigation"
    >
      {columns.map((col, i) => {
        const isActive = activeIndex === i;
        return (
          <button
            key={col.id}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onTabClick(i)}
            className={`shrink-0 rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${tc.focusRing} ${
              isActive
                ? `bg-accent text-white`
                : `border ${tc.border} ${tc.textFaint} ${tc.bgHover}`
            }`}
          >
            {col.title}
            <span aria-hidden className="ml-1.5 text-xs opacity-70">
              {col.cards.length}
            </span>
          </button>
        );
      })}
      <button
        type="button"
        onClick={onAddColumn}
        aria-label="Add column"
        className={`ml-auto shrink-0 rounded-full border border-dashed ${tc.border} px-3 py-1.5 text-sm ${tc.textFaint} ${tc.textHover} ${tc.bgHover} transition-colors ${tc.focusRing}`}
      >
        + Add Column
      </button>
    </div>
  );
}
