import { tc } from "../../theme/classNames";

type Props = Readonly<{
  number: number;
  ticketTypeId: string | null;
  /** Snapshot of the ticket type color stored on the card at assignment time */
  ticketTypeColor?: string;
}>;

export function TicketTypeBadge({
  number,
  ticketTypeId,
  ticketTypeColor,
}: Props) {
  // Card data is static — always use the snapshot stored on the card, not current config
  const displayLabel = ticketTypeId
    ? `${ticketTypeId}-${number}`
    : `#${number}`;

  if (ticketTypeColor) {
    return (
      <span
        className="inline-block text-xs font-mono font-medium tabular-nums rounded-sm px-1 select-none"
        style={{
          backgroundColor: `${ticketTypeColor}20`,
          color: ticketTypeColor,
        }}
      >
        {displayLabel}
      </span>
    );
  }

  return (
    <span
      className={`text-xs tabular-nums font-mono ${tc.textFaint} select-none`}
    >
      {displayLabel}
    </span>
  );
}
