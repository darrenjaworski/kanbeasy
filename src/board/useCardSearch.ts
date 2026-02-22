import { useMemo, useState } from "react";
import Fuse from "fuse.js";
import type { Column } from "./types";

export function useCardSearch(columns: Column[]) {
  const [searchQuery, setSearchQuery] = useState("");

  const matchingCardIds = useMemo(() => {
    if (searchQuery.trim().length < 2) {
      return new Set<string>();
    }

    const allCards = columns.flatMap((col) => col.cards);

    const fuse = new Fuse(allCards, {
      keys: ["title"],
      threshold: 0.4,
      ignoreLocation: true,
    });

    const results = fuse.search(searchQuery);
    return new Set(results.map((result) => result.item.id));
  }, [searchQuery, columns]);

  return { searchQuery, setSearchQuery, matchingCardIds };
}
