import type { ReactNode } from "react";
import { tc } from "../../theme/classNames";

type Props = Readonly<{
  content: string;
  side?: "top" | "bottom";
  disabled?: boolean;
  children: ReactNode;
}>;

const positionClasses = {
  top: "bottom-full left-1/2 -translate-x-1/2 mb-1",
  bottom: "top-full left-1/2 -translate-x-1/2 mt-1",
} as const;

export function Tooltip({
  content,
  side = "bottom",
  disabled = false,
  children,
}: Props) {
  return (
    <span className="group/tooltip relative inline-flex">
      {children}
      {!disabled && (
        <span
          role="tooltip"
          aria-hidden
          data-side={side}
          className={`pointer-events-none absolute z-50 ${positionClasses[side]} whitespace-nowrap rounded-md px-2 py-1 ${tc.tooltip} opacity-0 transition-opacity group-hover/tooltip:delay-300 group-hover/tooltip:opacity-100 group-focus-within/tooltip:delay-300 group-focus-within/tooltip:opacity-100`}
        >
          {content}
        </span>
      )}
    </span>
  );
}
