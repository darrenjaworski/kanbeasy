import { useBoard } from "../board/useBoard";

export function SearchInput() {
  const { searchQuery, setSearchQuery, matchingCardIds } = useBoard();

  return (
    <div className="relative flex-1 max-w-md">
      <input
        type="search"
        placeholder="Search cards..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 px-3 py-1.5 text-sm placeholder:text-black/40 dark:placeholder:text-white/40 focus:outline-hidden focus:ring-2 focus:ring-blue-500"
        aria-label="Search cards"
        data-testid="search-input"
      />
      {searchQuery && matchingCardIds.size > 0 && (
        <div className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-black/60 dark:text-white/60">
          {matchingCardIds.size} {matchingCardIds.size === 1 ? "match" : "matches"}
        </div>
      )}
    </div>
  );
}
