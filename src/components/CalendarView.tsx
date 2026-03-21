import { useMemo, useState } from "react";
import { useBoard } from "../board/useBoard";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";
import { useIsMobile } from "../hooks";
import { CardTypeBadge } from "./shared/CardTypeBadge";
import { CardDetailModal } from "./board/CardDetailModal";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getMonthGrid(year: number, month: number) {
  const first = new Date(year, month, 1);
  const startDay = first.getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [];
  for (let i = 0; i < startDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);
  while (cells.length % 7 !== 0) cells.push(null);
  return cells;
}

function toDateStr(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

interface CardEntry {
  id: string;
  number: number;
  title: string;
  cardTypeId: string | null;
  cardTypeLabel?: string;
  cardTypeColor?: string;
  dueDate: string;
}

interface CalendarHeaderProps {
  monthLabel: string;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
}

interface CalendarBodyProps {
  cardsByDate: Map<string, CardEntry[]>;
  year: number;
  month: number;
  todayStr: string;
  hasSearch: boolean;
  matchingCardIds: Set<string>;
  onSelect: (id: string) => void;
}

function CalendarHeader({
  monthLabel,
  onPrev,
  onNext,
  onToday,
}: CalendarHeaderProps) {
  return (
    <div className="flex items-center justify-between mb-4">
      <button
        type="button"
        onClick={onPrev}
        className={`p-1.5 rounded-md ${tc.bgHover} ${tc.focusRing}`}
        aria-label="Previous month"
      >
        <svg
          className="size-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      <div className="flex items-center gap-3">
        <h2 className={`text-lg font-semibold ${tc.text}`}>{monthLabel}</h2>
        <button
          type="button"
          onClick={onToday}
          className={`text-sm px-3 py-1.5 rounded ${tc.bgHover} ${tc.border} border ${tc.focusRing}`}
        >
          Today
        </button>
      </div>
      <button
        type="button"
        onClick={onNext}
        className={`p-1.5 rounded-md ${tc.bgHover} ${tc.focusRing}`}
        aria-label="Next month"
      >
        <svg
          className="size-5"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M7.21 14.77a.75.75 0 01.02-1.06L11.168 10 7.23 6.29a.75.75 0 111.04-1.08l4.5 4.25a.75.75 0 010 1.08l-4.5 4.25a.75.75 0 01-1.06-.02z"
            clipRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

function DayList({
  cardsByDate,
  year,
  month,
  todayStr,
  hasSearch,
  matchingCardIds,
  onSelect,
}: CalendarBodyProps) {
  const monthPrefix = `${year}-${String(month + 1).padStart(2, "0")}-`;

  const days = useMemo(
    () =>
      Array.from(cardsByDate.entries())
        .filter(([date]) => date.startsWith(monthPrefix))
        .sort(([a], [b]) => a.localeCompare(b)),
    [cardsByDate, monthPrefix],
  );

  if (days.length === 0) {
    return (
      <p className={`text-center py-8 ${tc.textMuted}`}>
        No cards due this month.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {days.map(([dateStr, cards]) => {
        const isToday = dateStr === todayStr;
        const dayLabel = new Date(dateStr + "T00:00").toLocaleDateString(
          undefined,
          { month: "short", day: "numeric" },
        );
        return (
          <div key={dateStr}>
            <div className="flex items-center gap-2 mb-2">
              <span
                className={`text-xs font-semibold ${isToday ? "text-accent" : tc.textMuted}`}
              >
                {dayLabel}
              </span>
              {isToday && (
                <span className="text-xs text-accent font-medium">today</span>
              )}
              <div className={`flex-1 h-px ${tc.separator}`} />
            </div>
            <div className="flex flex-col gap-1.5">
              {cards.map((card) => {
                const isMatch = hasSearch && matchingCardIds.has(card.id);
                return (
                  <button
                    type="button"
                    key={card.id}
                    onClick={() => onSelect(card.id)}
                    className={`w-full text-left rounded-lg border p-3 ${tc.border} bg-surface ${tc.bgHover} transition-colors ${isMatch ? "ring-2 ring-accent" : ""}`}
                  >
                    <div className="flex items-center gap-2">
                      <CardTypeBadge
                        number={card.number}
                        cardTypeId={card.cardTypeId}
                        cardTypeColor={card.cardTypeColor}
                      />
                      <span className={`text-sm ${tc.text} truncate`}>
                        {card.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalendarGrid({
  cardsByDate,
  year,
  month,
  todayStr,
  hasSearch,
  matchingCardIds,
  onSelect,
}: CalendarBodyProps) {
  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

  return (
    <>
      <div className="grid grid-cols-7 mb-1">
        {DAYS.map((d) => (
          <div
            key={d}
            className={`text-center text-xs font-medium py-1 ${tc.textMuted}`}
          >
            {d}
          </div>
        ))}
      </div>
      <div
        className={`grid grid-cols-7 border-t border-l ${tc.border}`}
        data-testid="calendar-grid"
      >
        {cells.map((day, i) => {
          const dateStr = day ? toDateStr(year, month, day) : null;
          const cards = dateStr ? (cardsByDate.get(dateStr) ?? []) : [];
          const isToday = dateStr === todayStr;

          const matchCount = hasSearch
            ? cards.filter((c) => matchingCardIds.has(c.id)).length
            : 0;

          return (
            <div
              key={i}
              className={`relative border-r border-b ${tc.border} h-32 overflow-y-auto ${
                day ? "" : "bg-black/5 dark:bg-white/5"
              }`}
            >
              {day && (
                <>
                  <div className="sticky top-0 z-[1] flex items-center justify-between px-1 py-1 bg-surface backdrop-blur-sm">
                    <span
                      className={`text-xs inline-flex items-center justify-center size-6 rounded-full ${
                        isToday
                          ? "bg-accent text-white font-bold"
                          : tc.textMuted
                      }`}
                    >
                      {day}
                    </span>
                    {matchCount > 0 && cards.length > 4 && (
                      <span
                        className="text-[10px] font-medium px-1.5 py-0.5 rounded-full bg-accent/15 text-accent"
                        data-testid="calendar-match-badge"
                      >
                        {matchCount} {matchCount === 1 ? "match" : "matches"}
                      </span>
                    )}
                  </div>
                  <div className="px-1 pb-1 space-y-1">
                    {cards.map((card) => {
                      const isMatch = hasSearch && matchingCardIds.has(card.id);
                      return (
                        <button
                          type="button"
                          key={card.id}
                          onClick={() => onSelect(card.id)}
                          className={`w-full text-left text-xs truncate rounded px-1 py-0.5 ${
                            isMatch
                              ? `border-accent ${tc.searchHighlight}`
                              : `${tc.glass} ${tc.border} border`
                          } ${tc.bgHover} cursor-pointer`}
                          title={card.title}
                          data-search-highlight={isMatch || undefined}
                        >
                          <CardTypeBadge
                            number={card.number}
                            cardTypeId={card.cardTypeId}
                            cardTypeColor={card.cardTypeColor}
                          />
                          <span className="ml-1">{card.title}</span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          );
        })}
      </div>
    </>
  );
}

export function CalendarView() {
  const {
    columns,
    updateCard,
    moveCard,
    archiveCard,
    matchingCardIds,
    searchQuery,
  } = useBoard();
  const { cardTypes, cardDensity } = useTheme();

  const [detailCardId, setDetailCardId] = useState<string | null>(null);
  const detailCard = detailCardId
    ? (() => {
        for (const col of columns) {
          const card = col.cards.find((c) => c.id === detailCardId);
          if (card) return { card, columnId: col.id };
        }
        return null;
      })()
    : null;

  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth());

  const cardsByDate = useMemo(() => {
    const map = new Map<string, CardEntry[]>();
    for (const col of columns) {
      for (const card of col.cards) {
        if (!card.dueDate) continue;
        const existing = map.get(card.dueDate) ?? [];
        existing.push({
          id: card.id,
          number: card.number,
          title: card.title,
          cardTypeId: card.cardTypeId,
          cardTypeLabel: card.cardTypeLabel,
          cardTypeColor: card.cardTypeColor,
          dueDate: card.dueDate,
        });
        map.set(card.dueDate, existing);
      }
    }
    return map;
  }, [columns]);

  const todayStr = toDateStr(
    today.getFullYear(),
    today.getMonth(),
    today.getDate(),
  );

  const monthLabel = new Date(year, month).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });

  function prevMonth() {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  }

  function nextMonth() {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  }

  function goToday() {
    setYear(today.getFullYear());
    setMonth(today.getMonth());
  }

  const hasSearch = searchQuery.length >= 2;
  const isMobile = useIsMobile();

  const totalDue = Array.from(cardsByDate.values()).reduce(
    (sum, cards) => sum + cards.length,
    0,
  );

  const bodyProps: CalendarBodyProps = {
    cardsByDate,
    year,
    month,
    todayStr,
    hasSearch,
    matchingCardIds,
    onSelect: setDetailCardId,
  };

  return (
    <main className="p-6">
      {totalDue === 0 ? (
        <p className={`text-center py-12 ${tc.textMuted}`}>
          No cards with due dates. Set due dates in the card detail modal to see
          them here.
        </p>
      ) : (
        <div className={`rounded-lg border ${tc.border} bg-surface p-3`}>
          <CalendarHeader
            monthLabel={monthLabel}
            onPrev={prevMonth}
            onNext={nextMonth}
            onToday={goToday}
          />
          {isMobile ? (
            <DayList {...bodyProps} />
          ) : (
            <CalendarGrid {...bodyProps} />
          )}
        </div>
      )}
      {detailCard && (
        <CardDetailModal
          open={!!detailCard}
          onClose={() => setDetailCardId(null)}
          card={detailCard.card}
          columnId={detailCard.columnId}
          columns={columns}
          density={cardDensity}
          onUpdate={(updates) =>
            updateCard(detailCard.columnId, detailCard.card.id, updates)
          }
          onMoveCard={(toColumnId) =>
            moveCard(detailCard.columnId, toColumnId, detailCard.card.id)
          }
          onArchive={() => {
            archiveCard(detailCard.columnId, detailCard.card.id);
            setDetailCardId(null);
          }}
          cardTypes={cardTypes}
        />
      )}
    </main>
  );
}
