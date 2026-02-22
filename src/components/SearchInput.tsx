import { useBoard } from "../board/useBoard";
import { tc } from "../theme/classNames";

export function SearchInput() {
  const { searchQuery, setSearchQuery, matchingCardIds } = useBoard();

  const showMatchCount = searchQuery && matchingCardIds.size > 0;

  return (
    <div className="relative flex-1 max-w-md">
      <input
        id="search-cards"
        type="search"
        placeholder="Search cards..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className={`w-full rounded-md border ${tc.border} ${tc.glass} px-3 ${showMatchCount ? "pr-24" : ""} py-1.5 text-sm placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-blue-500`}
        aria-label="Search cards"
        data-testid="search-input"
      />
      {showMatchCount && (
        <div className={`pointer-events-none absolute right-8 top-1/2 -translate-y-1/2 text-xs ${tc.textFaint}`}>
          {matchingCardIds.size} {matchingCardIds.size === 1 ? "match" : "matches"}
        </div>
      )}
    </div>
  );
}
