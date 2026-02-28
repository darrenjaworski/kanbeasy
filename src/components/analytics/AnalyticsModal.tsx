import { useState } from "react";
import { Modal } from "../shared/Modal";
import { AnalyticsIcon } from "../icons";
import { tc } from "../../theme/classNames";
import { ModalHeader } from "../shared/ModalHeader";
import { MetricCard } from "./MetricCard";
import { MetricsTable } from "./MetricsTable";
import { useBoard } from "../../board/useBoard";
import {
  computeAverageCycleTime,
  formatDuration,
  getCardCycleTimes,
} from "../../utils/cycleTime";
import {
  computeAverageReverseTime,
  getCardReverseTimes,
  getCardsInFlight,
  getThroughput,
  getTotalCards,
} from "../../utils/boardMetrics";

const PAGE_SIZE = 10;

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function AnalyticsModal({ open, onClose }: Props) {
  const { columns, archive } = useBoard();
  const [cycleTimeVisible, setCycleTimeVisible] = useState(PAGE_SIZE);
  const [reverseTimeVisible, setReverseTimeVisible] = useState(PAGE_SIZE);

  if (!open) return null;

  const totalCards = getTotalCards(columns);
  const cardsInFlight = getCardsInFlight(columns);
  const avgCycleTime = computeAverageCycleTime(columns, archive);
  const avgReverseTime = computeAverageReverseTime(columns, undefined, archive);
  const throughput = getThroughput(columns, undefined, archive);
  const cardCycleTimes = getCardCycleTimes(columns, archive);
  const cardReverseTimes = getCardReverseTimes(columns, undefined, archive);

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="analytics-title">
      <div className="p-4 pb-2 shrink-0">
        <ModalHeader
          icon={AnalyticsIcon}
          title="Analytics"
          titleId="analytics-title"
          onClose={onClose}
        />
      </div>

      <div className="p-4 pt-3 overflow-y-auto">
        <p className={`text-xs ${tc.textFaint} mb-3`}>
          Total cards and cards in flight reflect the current board only. Cycle
          time, throughput, and reverse time include archived cards (marked as
          &ldquo;archived&rdquo; in the tables below). Permanently deleted cards
          are excluded from all metrics. Reordering columns resets all data.
        </p>

        {/* Metric cards grid */}
        <div className="grid grid-cols-2 gap-3">
          <MetricCard
            label="Total Cards"
            value={String(totalCards)}
            description="Across all columns"
          />
          <MetricCard
            label="Cards in Flight"
            value={String(cardsInFlight)}
            description="Cards not in the first or last column"
          />
          <MetricCard
            label="Avg Cycle Time"
            value={avgCycleTime !== null ? formatDuration(avgCycleTime) : null}
            description="Average time from first to last column"
          />
          <MetricCard
            label="Avg Reverse Time"
            value={
              avgReverseTime !== null ? formatDuration(avgReverseTime) : null
            }
            description="Average time cards spend moving backwards"
          />
        </div>

        {/* Throughput card */}
        <div className={`mt-3 rounded-lg border ${tc.border} ${tc.glass} p-4`}>
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
          <MetricsTable
            title="Card Cycle Times"
            columnLabel="Cycle Time"
            rows={cardCycleTimes.map((ct) => ({
              cardTitle: ct.cardTitle,
              durationMs: ct.cycleTimeMs,
              isArchived: ct.isArchived,
            }))}
            visibleCount={cycleTimeVisible}
            onShowMore={() => setCycleTimeVisible((v) => v + PAGE_SIZE)}
          />
        )}

        {/* Reverse time table */}
        {cardReverseTimes.length > 0 && (
          <MetricsTable
            title="Card Reverse Times"
            columnLabel="Reverse Time"
            rows={cardReverseTimes.map((rt) => ({
              cardTitle: rt.cardTitle,
              durationMs: rt.reverseTimeMs,
              isArchived: rt.isArchived,
            }))}
            visibleCount={reverseTimeVisible}
            onShowMore={() => setReverseTimeVisible((v) => v + PAGE_SIZE)}
          />
        )}
      </div>
    </Modal>
  );
}
