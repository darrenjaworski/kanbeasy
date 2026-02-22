import { Modal } from "./Modal";
import { AnalyticsIcon } from "./icons/AnalyticsIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { tc } from "../theme/classNames";
import { useBoard } from "../board/useBoard";
import {
  computeAverageCycleTime,
  formatDuration,
} from "../utils/cycleTime";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function AnalyticsModal({ open, onClose }: Props) {
  const { columns } = useBoard();

  if (!open) return null;

  const avgCycleTime = computeAverageCycleTime(columns);

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="analytics-title">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <AnalyticsIcon className={`size-5 ${tc.textMuted}`} />
          <h2
            id="analytics-title"
            className="text-base font-semibold tracking-tight"
          >
            Analytics
          </h2>
          <button
            type="button"
            className={`ml-auto ${tc.iconButton} h-6 w-6 rounded-full`}
            onClick={onClose}
            aria-label="Close analytics"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
        <div
          className={`rounded-lg border ${tc.border} ${tc.glass} p-4`}
        >
          <p className={`text-xs font-medium uppercase tracking-wide ${tc.textFaint} mb-1`}>
            Average Cycle Time
          </p>
          {avgCycleTime !== null ? (
            <p className="text-2xl font-semibold tabular-nums">
              {formatDuration(avgCycleTime)}
            </p>
          ) : (
            <p className={`text-sm ${tc.textMuted}`}>
              Not enough data. Move cards between columns to see cycle time.
            </p>
          )}
          <p className={`text-xs ${tc.textFaint} mt-2`}>
            How long cards take on average to move from their first column to their last.
          </p>
        </div>
      </div>
    </Modal>
  );
}
