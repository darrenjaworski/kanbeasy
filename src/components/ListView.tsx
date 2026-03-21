import { useMemo, useState } from "react";
import { useBoard } from "../board/useBoard";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";
import { useIsMobile } from "../hooks";

import { CardTypeBadge } from "./shared/CardTypeBadge";
import { CardDetailModal } from "./board/CardDetailModal";
import { formatDate } from "../utils/formatDate";

interface CardRow {
  id: string;
  number: number;
  title: string;
  cardTypeId: string | null;
  cardTypeLabel?: string;
  cardTypeColor?: string;
  dueDate: string | null;
  columnTitle: string;
  createdAt: number;
}

interface ListProps {
  rows: CardRow[];
  matchingCardIds: Set<string>;
  hasSearch: boolean;
  onSelect: (id: string) => void;
}

function CardList({ rows, matchingCardIds, hasSearch, onSelect }: ListProps) {
  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const highlighted = hasSearch && matchingCardIds.has(row.id);
        return (
          <li key={row.id}>
            <button
              type="button"
              onClick={() => onSelect(row.id)}
              className={`w-full text-left rounded-lg border p-3 ${tc.border} bg-surface ${tc.bgHover} transition-colors ${highlighted ? "ring-2 ring-accent" : ""}`}
            >
              <div className="flex items-center gap-2 mb-1">
                <CardTypeBadge
                  number={row.number}
                  cardTypeId={row.cardTypeId}
                  cardTypeColor={row.cardTypeColor}
                />
              </div>
              <p className={`text-sm font-medium ${tc.text} mb-1`}>
                {row.title}
              </p>
              <div className={`flex flex-col gap-0.5 text-xs ${tc.textFaint}`}>
                {row.cardTypeLabel && (
                  <span>
                    Type:{" "}
                    <span style={{ color: row.cardTypeColor }}>
                      {row.cardTypeLabel}
                    </span>
                  </span>
                )}
                <span>Column: {row.columnTitle}</span>
                {row.dueDate && (
                  <span>
                    Due:{" "}
                    {formatDate(new Date(row.dueDate + "T00:00").getTime())}
                  </span>
                )}
                <span>Created: {formatDate(row.createdAt)}</span>
              </div>
            </button>
          </li>
        );
      })}
    </ul>
  );
}

function CardTable({ rows, matchingCardIds, hasSearch, onSelect }: ListProps) {
  return (
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
                  onClick={() => onSelect(row.id)}
                  className={`cursor-pointer ${tc.bgHover} ${i < rows.length - 1 ? `border-b ${tc.borderSubtle}` : ""} ${highlighted ? "ring-2 ring-accent ring-inset" : ""}`}
                >
                  <td className="px-3 py-2" data-testid="list-cell-number">
                    <CardTypeBadge
                      number={row.number}
                      cardTypeId={row.cardTypeId}
                      cardTypeColor={row.cardTypeColor}
                    />
                  </td>
                  <td
                    className={`px-3 py-2 ${tc.textMuted}`}
                    data-testid="list-cell-type"
                  >
                    {row.cardTypeLabel ? (
                      <span style={{ color: row.cardTypeColor }}>
                        {row.cardTypeLabel}
                      </span>
                    ) : (
                      "\u2014"
                    )}
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
                      ? formatDate(new Date(row.dueDate + "T00:00").getTime())
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
  );
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

  const rows = useMemo<CardRow[]>(
    () =>
      columns.flatMap((col) =>
        col.cards.map((card) => ({
          id: card.id,
          number: card.number,
          title: card.title,
          cardTypeId: card.cardTypeId,
          cardTypeLabel: card.cardTypeLabel,
          cardTypeColor: card.cardTypeColor,
          dueDate: card.dueDate,
          columnTitle: col.title,
          createdAt: card.createdAt,
        })),
      ),
    [columns],
  );

  const hasSearch = searchQuery.length >= 2;
  const isMobile = useIsMobile();

  const sharedProps: ListProps = {
    rows,
    matchingCardIds,
    hasSearch,
    onSelect: setDetailCardId,
  };

  return (
    <main className="mx-auto max-w-5xl p-6">
      {rows.length === 0 ? (
        <p className={`text-center py-12 ${tc.textMuted}`}>
          No cards yet. Switch to the board view to add some.
        </p>
      ) : isMobile ? (
        <CardList {...sharedProps} />
      ) : (
        <CardTable {...sharedProps} />
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
