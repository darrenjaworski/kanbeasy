import { tc } from "../../theme/classNames";

type Props = Readonly<{
  number: number;
  cardTypeId: string | null;
  /** Snapshot of the card type color stored on the card at assignment time */
  cardTypeColor?: string;
}>;

export function CardTypeBadge({ number, cardTypeId, cardTypeColor }: Props) {
  // Card data is static — always use the snapshot stored on the card, not current config
  const displayLabel = cardTypeId ? `${cardTypeId}-${number}` : `#${number}`;

  if (cardTypeColor) {
    return (
      <span
        className="inline-block text-xs font-mono font-medium tabular-nums rounded-sm px-1 select-none"
        style={{
          backgroundColor: `${cardTypeColor}20`,
          color: cardTypeColor,
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
