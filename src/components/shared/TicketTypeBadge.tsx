import type { TicketType } from "../../constants/ticketTypes";
import { findTicketType, formatCardId } from "../../utils/formatCardId";
import { tc } from "../../theme/classNames";

type Props = Readonly<{
  number: number;
  ticketTypeId: string | null;
  ticketTypes: TicketType[];
}>;

export function TicketTypeBadge({ number, ticketTypeId, ticketTypes }: Props) {
  const type = findTicketType(ticketTypes, ticketTypeId);
  const label = formatCardId(number, ticketTypeId, ticketTypes);

  if (type) {
    return (
      <span
        className="inline-block text-xs font-mono font-medium tabular-nums rounded-sm px-1 select-none"
        style={{
          backgroundColor: `${type.color}20`,
          color: type.color,
        }}
      >
        {label}
      </span>
    );
  }

  return (
    <span
      className={`text-xs tabular-nums font-mono ${tc.textFaint} select-none`}
    >
      {label}
    </span>
  );
}
