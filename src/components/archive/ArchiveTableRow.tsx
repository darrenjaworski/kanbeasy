import type { ArchivedCard } from "../../board/types";
import { tc } from "../../theme/classNames";
import { formatDateTime } from "../../utils/formatDate";

type Props = Readonly<{
  card: ArchivedCard;
  selected: boolean;
  onToggle: (cardId: string) => void;
  isLast: boolean;
}>;

export function ArchiveTableRow({ card, selected, onToggle, isLast }: Props) {
  return (
    <tr
      className={isLast ? undefined : `border-b ${tc.borderSubtle}`}
      data-testid="archive-card-row"
    >
      <td className="px-3 py-2 w-8">
        <input
          type="checkbox"
          checked={selected}
          onChange={() => onToggle(card.id)}
          aria-label={`Select card #${card.number}`}
          className="accent-[var(--color-accent)]"
          data-testid={`archive-select-${card.id}`}
        />
      </td>
      <td className={`px-3 py-2 ${tc.textFaint} tabular-nums text-right w-12`}>
        #{card.number}
      </td>
      <td className={`px-3 py-2 ${tc.text} truncate`}>
        {card.title || "Untitled"}
      </td>
      <td className={`px-3 py-2 ${tc.textFaint} whitespace-nowrap text-right`}>
        {formatDateTime(card.archivedAt)}
      </td>
    </tr>
  );
}
