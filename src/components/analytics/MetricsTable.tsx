import { tc } from "../../theme/classNames";
import { formatDuration } from "../../utils/cycleTime";

type Props = Readonly<{
  title: string;
  columnLabel: string;
  rows: { cardTitle: string; durationMs: number }[];
  visibleCount: number;
  onShowMore: () => void;
}>;

export function MetricsTable({
  title,
  columnLabel,
  rows,
  visibleCount,
  onShowMore,
}: Props) {
  const visibleRows = rows.slice(0, visibleCount);
  const remaining = rows.length - visibleCount;

  return (
    <div className="mt-4">
      <h3
        className={`text-xs font-medium uppercase tracking-wide ${tc.textFaint} mb-2`}
      >
        {title}
      </h3>
      <div className={`rounded-lg border ${tc.border} overflow-hidden`}>
        <table className="w-full text-sm">
          <thead>
            <tr className={`${tc.glass} border-b ${tc.border}`}>
              <th className={`text-left px-3 py-2 font-medium ${tc.textMuted}`}>
                Card
              </th>
              <th
                className={`text-right px-3 py-2 font-medium ${tc.textMuted}`}
              >
                {columnLabel}
              </th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row, i) => (
              <tr
                key={i}
                className={
                  i < visibleRows.length - 1
                    ? `border-b ${tc.borderSubtle}`
                    : undefined
                }
              >
                <td className={`px-3 py-2 ${tc.text}`}>
                  {row.cardTitle.length > 40
                    ? `${row.cardTitle.slice(0, 40)}...`
                    : row.cardTitle}
                </td>
                <td
                  className={`text-right px-3 py-2 tabular-nums ${tc.textMuted} whitespace-nowrap`}
                >
                  {formatDuration(row.durationMs)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {remaining > 0 && (
        <button
          type="button"
          className={`mt-2 w-full text-sm py-1.5 rounded-lg ${tc.button}`}
          onClick={onShowMore}
        >
          Show more ({remaining} remaining)
        </button>
      )}
    </div>
  );
}
