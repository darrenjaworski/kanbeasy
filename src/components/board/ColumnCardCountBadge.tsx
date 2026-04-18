import { tc } from "../../theme/classNames";
import { getBadgeHeat } from "./badgeHeat";

type Props = Readonly<{
  cardCount: number;
  index?: number;
  columnCount?: number;
  isMobile: boolean;
  canDrag: boolean;
}>;

export function ColumnCardCountBadge({
  cardCount,
  index,
  columnCount,
  isMobile,
  canDrag,
}: Props) {
  const heat = getBadgeHeat(cardCount, index, columnCount);
  return (
    <span
      className={`absolute top-2 z-1 inline-flex h-8 min-w-8 items-center justify-center rounded-full border ${tc.border} ${heat ? "" : tc.glassSubtle} backdrop-blur-sm px-2.5 text-sm ${heat?.bold ? "font-bold" : "font-medium"} ${heat ? tc.text : tc.textFaint} ${isMobile ? (canDrag ? "right-20" : "right-12") : `right-2 transition-[right] duration-200 ease-in-out ${canDrag ? "group-hover:right-20 group-focus-within:right-20" : "group-hover:right-12 group-focus-within:right-12"}`}`}
      style={
        heat
          ? {
              backgroundColor: `color-mix(in srgb, var(--color-accent) ${heat.accentPercent}%, transparent)`,
            }
          : undefined
      }
      aria-label={`${cardCount} card${cardCount === 1 ? "" : "s"}`}
      data-heat-level={heat ? (heat.bold ? "high" : "medium") : undefined}
    >
      {cardCount}
    </span>
  );
}
