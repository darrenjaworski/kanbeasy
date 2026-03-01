import type { ReactNode } from "react";
import { tc } from "../../theme/classNames";

type Props = Readonly<{
  content: string;
  side?: "top" | "bottom";
  children: ReactNode;
}>;

const positionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-2",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-2",
} as const;

const arrowClasses = {
  top: "top-full left-1/2 -translate-x-1/2 border-t-black/10 dark:border-t-white/10 border-x-transparent border-b-transparent",
  bottom:
    "bottom-full left-1/2 -translate-x-1/2 border-b-black/10 dark:border-b-white/10 border-x-transparent border-t-transparent",
} as const;

export function Tooltip({ content, side = "top", children }: Props) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      <span
        role="tooltip"
        aria-hidden
        className={`pointer-events-none absolute z-50 ${positionClasses[side]} whitespace-nowrap rounded-md px-2 py-1 ${tc.tooltip} opacity-0 transition-opacity delay-300 group-hover/tooltip:opacity-100 group-focus-within/tooltip:opacity-100`}
      >
        {content}
        <span
          aria-hidden
          className={`absolute h-0 w-0 border-4 ${arrowClasses[side]}`}
        />
      </span>
    </span>
  );
}
