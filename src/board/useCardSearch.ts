import { useCallback, useMemo, useState } from "react";
import Fuse from "fuse.js";
import type { Column } from "./types";
import { SEARCH_FUZZY_THRESHOLD } from "../constants/behavior";

export function useCardSearch(columns: Column[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTypeIds, setSelectedTypeIds] = useState<Set<string>>(
    new Set(),
  );

  const clearTypeFilter = useCallback(() => setSelectedTypeIds(new Set()), []);
  const isFilterActive = selectedTypeIds.size > 0;

  const matchingCardIds = useMemo(() => {
    const hasTextSearch = searchQuery.trim().length >= 2;
    const hasTypeFilter = selectedTypeIds.size > 0;

    if (!hasTextSearch && !hasTypeFilter) return new Set<string>();

    const allCards = columns.flatMap((col) => col.cards);

    // Text matches via Fuse.js
    let textMatchIds: Set<string> | null = null;
    if (hasTextSearch) {
      const fuse = new Fuse(allCards, {
        keys: ["title", "description"],
        threshold: SEARCH_FUZZY_THRESHOLD,
        ignoreLocation: true,
      });
      textMatchIds = new Set(fuse.search(searchQuery).map((r) => r.item.id));
    }

    // Type matches (OR within selected types)
    let typeMatchIds: Set<string> | null = null;
    if (hasTypeFilter) {
      typeMatchIds = new Set(
        allCards
          .filter((c) => c.cardTypeId && selectedTypeIds.has(c.cardTypeId))
          .map((c) => c.id),
      );
    }

    // Combine: AND between text and type, OR within each
    if (textMatchIds && typeMatchIds) {
      return new Set([...textMatchIds].filter((id) => typeMatchIds.has(id)));
    }
    return textMatchIds ?? typeMatchIds!;
  }, [searchQuery, columns, selectedTypeIds]);

  return {
    searchQuery,
    setSearchQuery,
    matchingCardIds,
    selectedTypeIds,
    setSelectedTypeIds,
    clearTypeFilter,
    isFilterActive,
  };
}
