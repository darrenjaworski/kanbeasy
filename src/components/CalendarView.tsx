import { useMemo, useState } from "react";
import { useBoard } from "../board/useBoard";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";
import { TicketTypeBadge } from "./shared/TicketTypeBadge";
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
  ticketTypeId: string | null;
  ticketTypeLabel?: string;
  ticketTypeColor?: string;
  dueDate: string;
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
  const { ticketTypes, cardDensity } = useTheme();

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
          ticketTypeId: card.ticketTypeId,
          ticketTypeLabel: card.ticketTypeLabel,
          ticketTypeColor: card.ticketTypeColor,
          dueDate: card.dueDate,
        });
        map.set(card.dueDate, existing);
      }
    }
    return map;
  }, [columns]);

  const cells = useMemo(() => getMonthGrid(year, month), [year, month]);

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

  const totalDue = Array.from(cardsByDate.values()).reduce(
    (sum, cards) => sum + cards.length,
    0,
  );

  return (
    <main className="p-6">
      {totalDue === 0 ? (
        <p className={`text-center py-12 ${tc.textMuted}`}>
          No cards with due dates. Set due dates in the card detail modal to see
          them here.
        </p>
      ) : (
        <div className={`rounded-lg border ${tc.border} bg-surface p-3`}>
          {/* Header with navigation */}
          <div className="flex items-center justify-between mb-4">
            <button
              type="button"
              onClick={prevMonth}
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
              <h2 className={`text-lg font-semibold ${tc.text}`}>
                {monthLabel}
              </h2>
              <button
                type="button"
                onClick={goToday}
                className={`text-sm px-3 py-1.5 rounded ${tc.bgHover} ${tc.border} border ${tc.focusRing}`}
              >
                Today
              </button>
            </div>
            <button
              type="button"
              onClick={nextMonth}
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

          {/* Day headers */}
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

          {/* Calendar grid */}
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
                      <div
                        className={`sticky top-0 z-[1] flex items-center justify-between px-1 py-1 bg-surface backdrop-blur-sm`}
                      >
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
                            {matchCount}{" "}
                            {matchCount === 1 ? "match" : "matches"}
                          </span>
                        )}
                      </div>
                      <div className="px-1 pb-1 space-y-1">
                        {cards.map((card) => {
                          const isMatch =
                            hasSearch && matchingCardIds.has(card.id);
                          return (
                            <button
                              type="button"
                              key={card.id}
                              onClick={() => setDetailCardId(card.id)}
                              className={`w-full text-left text-xs truncate rounded px-1 py-0.5 ${
                                isMatch
                                  ? `border-accent ${tc.searchHighlight}`
                                  : `${tc.glass} ${tc.border} border`
                              } ${tc.bgHover} cursor-pointer`}
                              title={card.title}
                              data-search-highlight={isMatch || undefined}
                            >
                              <TicketTypeBadge
                                number={card.number}
                                ticketTypeId={card.ticketTypeId}
                                ticketTypeColor={card.ticketTypeColor}
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
          ticketTypes={ticketTypes}
        />
      )}
    </main>
  );
}
