import { useMemo, useState } from "react";
import { useBoard } from "../board/useBoard";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";

import { TicketTypeBadge } from "./shared/TicketTypeBadge";
import { CardDetailModal } from "./board/CardDetailModal";
import { findTicketType } from "../utils/formatCardId";
import { formatDate } from "../utils/formatDate";

interface CardRow {
  id: string;
  number: number;
  title: string;
  ticketTypeId: string | null;
  dueDate: string | null;
  columnTitle: string;
  createdAt: number;
}

export function ListView() {
  const {
    columns,
    matchingCardIds,
    searchQuery,
    updateCard,
    moveCard,
    archiveCard,
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

  const rows = useMemo<CardRow[]>(
    () =>
      columns.flatMap((col) =>
        col.cards.map((card) => ({
          id: card.id,
          number: card.number,
          title: card.title,
          ticketTypeId: card.ticketTypeId,
          dueDate: card.dueDate,
          columnTitle: col.title,
          createdAt: card.createdAt,
        })),
      ),
    [columns],
  );

  const hasSearch = searchQuery.length >= 2;

  return (
    <main className="mx-auto max-w-5xl p-6">
      {rows.length === 0 ? (
        <p className={`text-center py-12 ${tc.textMuted}`}>
          No cards yet. Switch to the board view to add some.
        </p>
      ) : (
        <div className={`rounded-lg border ${tc.border} bg-surface p-3`}>
          <div className={`overflow-hidden rounded-lg border ${tc.border}`}>
            <table className="w-full text-sm">
              <thead>
                <tr className={`${tc.glass} border-b ${tc.border}`}>
                  <th
                    className={`text-left px-3 py-2 font-medium ${tc.textMuted}`}
                    scope="col"
                  >
                    #
                  </th>
                  <th
                    className={`text-left px-3 py-2 font-medium ${tc.textMuted}`}
                    scope="col"
                  >
                    Type
                  </th>
                  <th
                    className={`text-left px-3 py-2 font-medium ${tc.textMuted}`}
                    scope="col"
                  >
                    Title
                  </th>
                  <th
                    className={`text-left px-3 py-2 font-medium ${tc.textMuted}`}
                    scope="col"
                  >
                    Due Date
                  </th>
                  <th
                    className={`text-left px-3 py-2 font-medium ${tc.textMuted}`}
                    scope="col"
                  >
                    Column
                  </th>
                  <th
                    className={`text-left px-3 py-2 font-medium ${tc.textMuted}`}
                    scope="col"
                  >
                    Created
                  </th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => {
                  const highlighted = hasSearch && matchingCardIds.has(row.id);
                  return (
                    <tr
                      key={row.id}
                      onClick={() => setDetailCardId(row.id)}
                      className={`cursor-pointer ${tc.bgHover} ${i < rows.length - 1 ? `border-b ${tc.borderSubtle}` : ""} ${highlighted ? "ring-2 ring-accent ring-inset" : ""}`}
                    >
                      <td className="px-3 py-2" data-testid="list-cell-number">
                        <TicketTypeBadge
                          number={row.number}
                          ticketTypeId={row.ticketTypeId}
                          ticketTypes={ticketTypes}
                        />
                      </td>
                      <td
                        className={`px-3 py-2 ${tc.textMuted}`}
                        data-testid="list-cell-type"
                      >
                        {(() => {
                          const type = findTicketType(
                            ticketTypes,
                            row.ticketTypeId,
                          );
                          return type ? (
                            <span style={{ color: type.color }}>
                              {type.label}
                            </span>
                          ) : (
                            "\u2014"
                          );
                        })()}
                      </td>
                      <td
                        className={`px-3 py-2 ${tc.text}`}
                        data-testid="list-cell-title"
                      >
                        {row.title}
                      </td>
                      <td
                        className={`px-3 py-2 ${tc.textMuted} whitespace-nowrap`}
                        data-testid="list-cell-due-date"
                      >
                        {row.dueDate
                          ? formatDate(
                              new Date(row.dueDate + "T00:00").getTime(),
                            )
                          : "\u2014"}
                      </td>
                      <td
                        className={`px-3 py-2 ${tc.textMuted}`}
                        data-testid="list-cell-column"
                      >
                        {row.columnTitle}
                      </td>
                      <td
                        className={`px-3 py-2 ${tc.textFaint} whitespace-nowrap`}
                        data-testid="list-cell-created"
                      >
                        {formatDate(row.createdAt)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
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
