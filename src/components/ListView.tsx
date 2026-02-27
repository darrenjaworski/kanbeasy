import { useMemo } from "react";
import { useBoard } from "../board/useBoard";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";
import { MarkdownPreview } from "./shared/MarkdownPreview";
import { TicketTypeBadge } from "./shared/TicketTypeBadge";
import { formatDate } from "../utils/formatDate";

interface CardRow {
  id: string;
  number: number;
  title: string;
  description: string;
  ticketTypeId: string | null;
  columnTitle: string;
  createdAt: number;
}

export function ListView() {
  const { columns, matchingCardIds, searchQuery } = useBoard();
  const { ticketTypes } = useTheme();

  const rows = useMemo<CardRow[]>(
    () =>
      columns.flatMap((col) =>
        col.cards.map((card) => ({
          id: card.id,
          number: card.number,
          title: card.title,
          description: card.description,
          ticketTypeId: card.ticketTypeId,
          columnTitle: col.title,
          createdAt: card.createdAt,
        })),
      ),
    [columns],
  );

  const hasSearch = searchQuery.length >= 2;

  return (
    <main className="mx-auto max-w-4xl px-4 py-6 pb-16">
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
                    className={`text-left px-3 py-2 font-medium ${tc.textMuted} w-12`}
                    scope="col"
                  >
                    #
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
                    Description
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
                      className={`${i < rows.length - 1 ? `border-b ${tc.borderSubtle}` : ""} ${highlighted ? "ring-2 ring-accent ring-inset" : ""}`}
                    >
                      <td className="px-3 py-2">
                        <TicketTypeBadge
                          number={row.number}
                          ticketTypeId={row.ticketTypeId}
                          ticketTypes={ticketTypes}
                        />
                      </td>
                      <td className={`px-3 py-2 ${tc.text}`}>{row.title}</td>
                      <td className={`px-3 py-2 ${tc.textMuted} max-w-xs`}>
                        {row.description ? (
                          <div className="overflow-hidden max-h-6 line-clamp-1">
                            <MarkdownPreview content={row.description} />
                          </div>
                        ) : (
                          "\u2014"
                        )}
                      </td>
                      <td className={`px-3 py-2 ${tc.textMuted}`}>
                        {row.columnTitle}
                      </td>
                      <td
                        className={`px-3 py-2 ${tc.textFaint} whitespace-nowrap`}
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
    </main>
  );
}
