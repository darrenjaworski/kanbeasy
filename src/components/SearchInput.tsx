import { useBoard } from "../board/useBoard";
import { tc } from "../theme/classNames";

export function SearchInput() {
  const { columns, searchQuery, setSearchQuery, matchingCardIds } = useBoard();

  const hasCards = columns.some((c) => c.cards.length > 0);
  const showMatchCount = searchQuery && matchingCardIds.size > 0;

  return (
    <div className="relative flex-1 max-w-xs">
      <input
        id="search-cards"
        type="search"
        placeholder="Search titles & descriptions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={!hasCards}
        className={`w-full rounded-md border ${tc.border} ${tc.glass} px-2.5 ${showMatchCount ? "pr-18" : ""} py-1.5 text-xs ${tc.placeholder} focus:outline-hidden focus:ring-2 focus:ring-accent disabled:opacity-40`}
        aria-label="Search cards"
        data-testid="search-input"
      />
      {showMatchCount && (
        <div
          className={`pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-xs ${tc.textFaint}`}
        >
          {matchingCardIds.size}{" "}
          {matchingCardIds.size === 1 ? "match" : "matches"}
        </div>
      )}
    </div>
  );
}
