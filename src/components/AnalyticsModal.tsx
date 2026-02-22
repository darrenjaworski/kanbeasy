import { useState } from "react";
import { Modal } from "./Modal";
import { AnalyticsIcon } from "./icons/AnalyticsIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { tc } from "../theme/classNames";
import { useBoard } from "../board/useBoard";
import {
  computeAverageCycleTime,
  formatDuration,
  getCardCycleTimes,
} from "../utils/cycleTime";
import {
  computeAverageReverseTime,
  getCardReverseTimes,
  getCardsInFlight,
  getThroughput,
  getTotalCards,
} from "../utils/boardMetrics";

const PAGE_SIZE = 10;

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function AnalyticsModal({ open, onClose }: Props) {
  const { columns } = useBoard();
  const [cycleTimeVisible, setCycleTimeVisible] = useState(PAGE_SIZE);
  const [reverseTimeVisible, setReverseTimeVisible] = useState(PAGE_SIZE);

  if (!open) return null;

  const totalCards = getTotalCards(columns);
  const cardsInFlight = getCardsInFlight(columns);
  const avgCycleTime = computeAverageCycleTime(columns);
  const avgReverseTime = computeAverageReverseTime(columns);
  const throughput = getThroughput(columns);
  const cardCycleTimes = getCardCycleTimes(columns);
  const cardReverseTimes = getCardReverseTimes(columns);

  const visibleCycleTimes = cardCycleTimes.slice(0, cycleTimeVisible);
  const visibleReverseTimes = cardReverseTimes.slice(0, reverseTimeVisible);

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="analytics-title">
      <div className="p-4 pb-2">
        <div className="flex items-center gap-3">
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
      </div>

      <div className="p-4 pt-3 max-h-[60vh] overflow-y-auto">
        <p className={`text-xs ${tc.textFaint} mb-3`}>
          Reordering columns resets all data. Deleted cards are not included in
          these metrics.
        </p>

        {/* Metric cards grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className={`rounded-lg border ${tc.border} ${tc.glass} p-4`}>
            <p
              className={`text-xs font-medium uppercase tracking-wide ${tc.textFaint} mb-1`}
            >
              Total Cards
            </p>
            <p className="text-2xl font-semibold tabular-nums">{totalCards}</p>
            <p className={`text-xs ${tc.textFaint} mt-2`}>
              Across all columns
            </p>
          </div>

          <div className={`rounded-lg border ${tc.border} ${tc.glass} p-4`}>
            <p
              className={`text-xs font-medium uppercase tracking-wide ${tc.textFaint} mb-1`}
            >
              Cards in Flight
            </p>
            <p className="text-2xl font-semibold tabular-nums">
              {cardsInFlight}
            </p>
            <p className={`text-xs ${tc.textFaint} mt-2`}>
              Cards not in the first or last column
            </p>
          </div>

          <div className={`rounded-lg border ${tc.border} ${tc.glass} p-4`}>
            <p
              className={`text-xs font-medium uppercase tracking-wide ${tc.textFaint} mb-1`}
            >
              Avg Cycle Time
            </p>
            {avgCycleTime !== null ? (
              <p className="text-2xl font-semibold tabular-nums">
                {formatDuration(avgCycleTime)}
              </p>
            ) : (
              <p className={`text-sm ${tc.textMuted}`}>Not enough data</p>
            )}
            <p className={`text-xs ${tc.textFaint} mt-2`}>
              Average time from first to last column
            </p>
          </div>

          <div className={`rounded-lg border ${tc.border} ${tc.glass} p-4`}>
            <p
              className={`text-xs font-medium uppercase tracking-wide ${tc.textFaint} mb-1`}
            >
              Avg Reverse Time
            </p>
            {avgReverseTime !== null ? (
              <p className="text-2xl font-semibold tabular-nums">
                {formatDuration(avgReverseTime)}
              </p>
            ) : (
              <p className={`text-sm ${tc.textMuted}`}>Not enough data</p>
            )}
            <p className={`text-xs ${tc.textFaint} mt-2`}>
              Average time cards spend moving backwards
            </p>
          </div>
        </div>

        {/* Throughput card */}
        <div
          className={`mt-3 rounded-lg border ${tc.border} ${tc.glass} p-4`}
        >
          <p
            className={`text-xs font-medium uppercase tracking-wide ${tc.textFaint} mb-2`}
          >
            Throughput
          </p>
          <div className="flex gap-6">
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {throughput.last7Days}
              </p>
              <p className={`text-xs ${tc.textFaint}`}>Last 7 days</p>
            </div>
            <div>
              <p className="text-2xl font-semibold tabular-nums">
                {throughput.last30Days}
              </p>
              <p className={`text-xs ${tc.textFaint}`}>Last 30 days</p>
            </div>
          </div>
          <p className={`text-xs ${tc.textFaint} mt-2`}>
            Cards completed in the last column
          </p>
        </div>

        {/* Cycle time table */}
        {cardCycleTimes.length > 0 && (
          <div className="mt-4">
            <h3
              className={`text-xs font-medium uppercase tracking-wide ${tc.textFaint} mb-2`}
            >
              Card Cycle Times
            </h3>
            <div
              className={`rounded-lg border ${tc.border} overflow-hidden`}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${tc.glass} border-b ${tc.border}`}>
                    <th
                      className={`text-left px-3 py-2 font-medium ${tc.textMuted}`}
                    >
                      Card
                    </th>
                    <th
                      className={`text-right px-3 py-2 font-medium ${tc.textMuted}`}
                    >
                      Cycle Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleCycleTimes.map((ct, i) => (
                    <tr
                      key={i}
                      className={
                        i < visibleCycleTimes.length - 1
                          ? `border-b ${tc.borderSubtle}`
                          : undefined
                      }
                    >
                      <td className={`px-3 py-2 ${tc.text}`}>
                        {ct.cardTitle.length > 40
                          ? `${ct.cardTitle.slice(0, 40)}...`
                          : ct.cardTitle}
                      </td>
                      <td
                        className={`text-right px-3 py-2 tabular-nums ${tc.textMuted} whitespace-nowrap`}
                      >
                        {formatDuration(ct.cycleTimeMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {cycleTimeVisible < cardCycleTimes.length && (
              <button
                type="button"
                className={`mt-2 w-full text-sm py-1.5 rounded-lg ${tc.button}`}
                onClick={() =>
                  setCycleTimeVisible((v) => v + PAGE_SIZE)
                }
              >
                Show more ({cardCycleTimes.length - cycleTimeVisible}{" "}
                remaining)
              </button>
            )}
          </div>
        )}

        {/* Reverse time table */}
        {cardReverseTimes.length > 0 && (
          <div className="mt-4">
            <h3
              className={`text-xs font-medium uppercase tracking-wide ${tc.textFaint} mb-2`}
            >
              Card Reverse Times
            </h3>
            <div
              className={`rounded-lg border ${tc.border} overflow-hidden`}
            >
              <table className="w-full text-sm">
                <thead>
                  <tr className={`${tc.glass} border-b ${tc.border}`}>
                    <th
                      className={`text-left px-3 py-2 font-medium ${tc.textMuted}`}
                    >
                      Card
                    </th>
                    <th
                      className={`text-right px-3 py-2 font-medium ${tc.textMuted}`}
                    >
                      Reverse Time
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {visibleReverseTimes.map((rt, i) => (
                    <tr
                      key={i}
                      className={
                        i < visibleReverseTimes.length - 1
                          ? `border-b ${tc.borderSubtle}`
                          : undefined
                      }
                    >
                      <td className={`px-3 py-2 ${tc.text}`}>
                        {rt.cardTitle.length > 40
                          ? `${rt.cardTitle.slice(0, 40)}...`
                          : rt.cardTitle}
                      </td>
                      <td
                        className={`text-right px-3 py-2 tabular-nums ${tc.textMuted} whitespace-nowrap`}
                      >
                        {formatDuration(rt.reverseTimeMs)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {reverseTimeVisible < cardReverseTimes.length && (
              <button
                type="button"
                className={`mt-2 w-full text-sm py-1.5 rounded-lg ${tc.button}`}
                onClick={() =>
                  setReverseTimeVisible((v) => v + PAGE_SIZE)
                }
              >
                Show more ({cardReverseTimes.length - reverseTimeVisible}{" "}
                remaining)
              </button>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
