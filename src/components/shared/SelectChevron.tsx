import { tc } from "../../theme/classNames";

/**
 * Decorative chevron overlay for styled <select> elements.
 * Must be inside a `position: relative` container alongside the <select>.
 * Pass a vertical-position class via `className` (default: centered).
 */
export function SelectChevron({
  className = "top-1/2 -translate-y-1/2",
}: {
  className?: string;
}) {
  return (
    <svg
      className={`pointer-events-none absolute right-2.5 size-4 ${tc.textFaint} ${className}`}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 20 20"
      fill="currentColor"
      aria-hidden
    >
      <path
        fillRule="evenodd"
        d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
        clipRule="evenodd"
      />
    </svg>
  );
}
