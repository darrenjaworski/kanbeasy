import { useMemo } from "react";
import { tc } from "../../theme/classNames";
import { getChecklistStats } from "../../utils/checklistStats";

type Props = Readonly<{
  description: string;
  className?: string;
  showCount?: boolean;
}>;

export function ChecklistProgress({
  description,
  className = "",
  showCount = true,
}: Props) {
  const stats = useMemo(() => getChecklistStats(description), [description]);

  if (!stats) return null;

  const percent = Math.round((stats.checked / stats.total) * 100);

  return (
    <div
      className={`flex items-center gap-2 ${className}`}
      data-testid="checklist-progress"
    >
      <div className="flex-1 h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300 bg-accent"
          style={{ width: `${percent}%` }}
        />
      </div>
      {showCount && (
        <span className={`text-xs ${tc.textFaint} tabular-nums shrink-0`}>
          {stats.checked}/{stats.total}
        </span>
      )}
    </div>
  );
}
