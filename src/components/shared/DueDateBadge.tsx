import { useMemo } from "react";
import { tc } from "../../theme/classNames";

type Props = Readonly<{
  dueDate: string | null;
  className?: string;
}>;

type Urgency = "overdue" | "soon" | "normal";

function getUrgency(dueDate: string): Urgency {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const due = new Date(dueDate + "T00:00");
  const diffMs = due.getTime() - today.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays < 0) return "overdue";
  if (diffDays <= 2) return "soon";
  return "normal";
}

const urgencyClasses: Record<Urgency, string> = {
  overdue: "text-red-600 dark:text-red-400",
  soon: "text-amber-600 dark:text-amber-400",
  normal: tc.textFaint,
};

function formatShortDate(dueDate: string): string {
  const date = new Date(dueDate + "T00:00");
  return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}

export function DueDateBadge({ dueDate, className = "" }: Props) {
  const result = useMemo(() => {
    if (!dueDate) return null;
    return {
      label: formatShortDate(dueDate),
      urgency: getUrgency(dueDate),
    };
  }, [dueDate]);

  if (!result) return null;

  return (
    <span
      className={`inline-flex items-center gap-1 text-xs select-none ${urgencyClasses[result.urgency]} ${className}`}
      data-testid="due-date-badge"
      title={result.urgency === "overdue" ? "Overdue" : dueDate!}
    >
      <svg
        className="size-3 shrink-0"
        viewBox="0 0 16 16"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        aria-hidden="true"
      >
        <rect x="2" y="3" width="12" height="11" rx="1.5" />
        <path d="M2 6.5h12M5.5 1.5v3M10.5 1.5v3" />
      </svg>
      {result.label}
    </span>
  );
}
