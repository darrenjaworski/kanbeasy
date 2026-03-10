import { createPortal } from "react-dom";
import { useEffect, useRef, useState } from "react";
import { useBoard } from "../board/useBoard";
import { useTheme } from "../theme/useTheme";
import { tc } from "../theme/classNames";
import { FilterIcon } from "./icons";

export function SearchInput() {
  const {
    columns,
    searchQuery,
    setSearchQuery,
    matchingCardIds,
    selectedTypeIds,
    setSelectedTypeIds,
    clearTypeFilter,
    isFilterActive,
  } = useBoard();
  const { cardTypes } = useTheme();
  const [filterOpen, setFilterOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [popoverPos, setPopoverPos] = useState({ top: 0, right: 0 });

  const hasCards = columns.some((c) => c.cards.length > 0);
  const showMatchCount =
    (searchQuery || isFilterActive) && matchingCardIds.size > 0;
  const filterDisabled = cardTypes.length === 0 || !hasCards;

  function getMatchCountPadding() {
    if (!showMatchCount) return "";
    if (matchingCardIds.size >= 100) return "pr-25";
    if (matchingCardIds.size >= 10) return "pr-24";
    return "pr-22";
  }
  const matchCountPadding = getMatchCountPadding();

  // Position the portal popover below the filter button
  useEffect(() => {
    if (!filterOpen || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    setPopoverPos({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
  }, [filterOpen]);

  // Close on click outside (only the popover and filter button are "inside")
  useEffect(() => {
    if (!filterOpen) return;
    const handler = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        popoverRef.current?.contains(target) ||
        buttonRef.current?.contains(target)
      ) {
        return;
      }
      setFilterOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [filterOpen]);

  function toggleType(typeId: string) {
    const next = new Set(selectedTypeIds);
    if (next.has(typeId)) {
      next.delete(typeId);
    } else {
      next.add(typeId);
    }
    setSelectedTypeIds(next);
  }

  return (
    <div ref={containerRef} className="relative flex-1 max-w-xs">
      <input
        id="search-cards"
        type="search"
        placeholder="Search titles & descriptions..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        disabled={!hasCards}
        className={`w-full rounded-md border ${tc.border} ${tc.glass} pl-2.5 pr-9.5 ${matchCountPadding} py-1.5 text-xs ${tc.placeholder} focus:outline-hidden focus:ring-2 focus:ring-accent disabled:opacity-40`}
        aria-label="Search cards"
        data-testid="search-input"
      />

      {showMatchCount && (
        <div
          className={`pointer-events-none absolute right-7 top-1/2 -translate-y-1/2 text-xs ${tc.textFaint}`}
        >
          {matchingCardIds.size}{" "}
          {matchingCardIds.size === 1 ? "match" : "matches"}
        </div>
      )}

      <button
        ref={buttonRef}
        type="button"
        onClick={() => setFilterOpen((prev) => !prev)}
        disabled={filterDisabled}
        className={`absolute right-1 top-1/2 -translate-y-1/2 rounded p-1 ${tc.bgHover} transition-colors disabled:opacity-40 disabled:pointer-events-none`}
        aria-label="Filter by card type"
        data-testid="card-type-filter-button"
      >
        <FilterIcon
          className={`size-3.5 ${isFilterActive ? "text-accent" : tc.textFaint}`}
        />
      </button>

      {filterOpen &&
        createPortal(
          <div
            ref={popoverRef}
            style={{ top: popoverPos.top, right: popoverPos.right }}
            className={`fixed z-50 min-w-48 rounded-lg border p-2 backdrop-blur ${tc.glass} ${tc.border}`}
            data-testid="card-type-filter-popover"
          >
            <div className="flex items-center justify-between mb-1.5 px-1">
              <span className={`text-xs font-medium ${tc.textMuted}`}>
                Filter by type
              </span>
              {isFilterActive && (
                <button
                  type="button"
                  onClick={clearTypeFilter}
                  className={`${tc.button} rounded-md px-1.5 py-0.5 text-xs`}
                  data-testid="card-type-filter-clear"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-col gap-0.5 max-h-60 overflow-y-auto">
              {cardTypes.map((ct) => (
                <label
                  key={ct.id}
                  className={`flex items-center gap-2 rounded-md px-1.5 py-1 text-xs cursor-pointer ${tc.bgHover} transition-colors`}
                  data-testid={`card-type-filter-option-${ct.id}`}
                >
                  <input
                    type="checkbox"
                    checked={selectedTypeIds.has(ct.id)}
                    onChange={() => toggleType(ct.id)}
                    className="accent-accent size-3.5"
                  />
                  <span
                    className="size-2.5 rounded-full shrink-0"
                    style={{ backgroundColor: ct.color }}
                  />
                  <span className={tc.text}>{ct.label}</span>
                </label>
              ))}
            </div>
          </div>,
          document.body,
        )}
    </div>
  );
}
