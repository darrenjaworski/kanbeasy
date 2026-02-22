import { tc } from "../theme/classNames";

type Props = Readonly<{
  label: string;
  value: string | null;
  fallback?: string;
  description: string;
}>;

export function MetricCard({
  label,
  value,
  fallback = "Not enough data",
  description,
}: Props) {
  return (
    <div className={`rounded-lg border ${tc.border} ${tc.glass} p-4`}>
      <p
        className={`text-xs font-medium uppercase tracking-wide ${tc.textFaint} mb-1`}
      >
        {label}
      </p>
      {value !== null ? (
        <p className="text-2xl font-semibold tabular-nums">{value}</p>
      ) : (
        <p className={`text-sm ${tc.textMuted}`}>{fallback}</p>
      )}
      <p className={`text-xs ${tc.textFaint} mt-2`}>{description}</p>
    </div>
  );
}
