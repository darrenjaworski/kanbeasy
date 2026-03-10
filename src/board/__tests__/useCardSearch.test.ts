import { act, renderHook } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { useCardSearch } from "../useCardSearch";
import type { Column } from "../types";
import { makeCard, makeColumn } from "../../test/builders";

function buildColumns(): Column[] {
  return [
    makeColumn({
      id: "col-1",
      title: "To Do",
      cards: [
        makeCard({
          id: "c1",
          title: "Auth feature",
          cardTypeId: "feat",
          cardTypeLabel: "Feature",
          cardTypeColor: "#22c55e",
        }),
        makeCard({
          id: "c2",
          title: "Fix login bug",
          cardTypeId: "fix",
          cardTypeLabel: "Fix",
          cardTypeColor: "#ef4444",
        }),
        makeCard({
          id: "c3",
          title: "Update docs",
          cardTypeId: "docs",
          cardTypeLabel: "Docs",
          cardTypeColor: "#06b6d4",
        }),
        makeCard({ id: "c4", title: "Untyped task", cardTypeId: null }),
      ],
    }),
  ];
}

describe("useCardSearch", () => {
  it("returns empty set when no search or filter is active", () => {
    const { result } = renderHook(() => useCardSearch(buildColumns()));
    expect(result.current.matchingCardIds.size).toBe(0);
    expect(result.current.isFilterActive).toBe(false);
  });

  it("text search matches cards by title (existing behavior)", () => {
    const { result } = renderHook(() => useCardSearch(buildColumns()));
    act(() => result.current.setSearchQuery("Auth"));
    expect(result.current.matchingCardIds.has("c1")).toBe(true);
    expect(result.current.matchingCardIds.has("c2")).toBe(false);
  });

  it("requires at least 2 characters for text search", () => {
    const { result } = renderHook(() => useCardSearch(buildColumns()));
    act(() => result.current.setSearchQuery("A"));
    expect(result.current.matchingCardIds.size).toBe(0);
  });

  it("type-only filter returns all cards of selected types", () => {
    const { result } = renderHook(() => useCardSearch(buildColumns()));
    act(() => result.current.setSelectedTypeIds(new Set(["feat"])));
    expect(result.current.matchingCardIds).toEqual(new Set(["c1"]));
    expect(result.current.isFilterActive).toBe(true);
  });

  it("type filter uses OR logic — multiple types match any", () => {
    const { result } = renderHook(() => useCardSearch(buildColumns()));
    act(() => result.current.setSelectedTypeIds(new Set(["feat", "fix"])));
    expect(result.current.matchingCardIds).toEqual(new Set(["c1", "c2"]));
  });

  it("cards with null cardTypeId are never matched by type filter", () => {
    const { result } = renderHook(() => useCardSearch(buildColumns()));
    act(() => result.current.setSelectedTypeIds(new Set(["feat"])));
    expect(result.current.matchingCardIds.has("c4")).toBe(false);
  });

  it("combined text + type filter uses AND (intersection)", () => {
    const { result } = renderHook(() => useCardSearch(buildColumns()));
    act(() => {
      result.current.setSearchQuery("Auth");
      result.current.setSelectedTypeIds(new Set(["feat"]));
    });
    // "Auth feature" matches text AND type=feat
    expect(result.current.matchingCardIds).toEqual(new Set(["c1"]));
  });

  it("combined filter returns empty when text and type don't overlap", () => {
    const { result } = renderHook(() => useCardSearch(buildColumns()));
    act(() => {
      result.current.setSearchQuery("docs");
      result.current.setSelectedTypeIds(new Set(["feat"]));
    });
    // "Update docs" matches text but type=docs, not feat
    expect(result.current.matchingCardIds.size).toBe(0);
  });

  it("clearTypeFilter resets the selected types", () => {
    const { result } = renderHook(() => useCardSearch(buildColumns()));
    act(() => result.current.setSelectedTypeIds(new Set(["feat", "fix"])));
    expect(result.current.isFilterActive).toBe(true);
    act(() => result.current.clearTypeFilter());
    expect(result.current.isFilterActive).toBe(false);
    expect(result.current.selectedTypeIds.size).toBe(0);
  });

  it("empty type filter behaves same as no filter", () => {
    const { result } = renderHook(() => useCardSearch(buildColumns()));
    act(() => result.current.setSelectedTypeIds(new Set()));
    expect(result.current.matchingCardIds.size).toBe(0);
    expect(result.current.isFilterActive).toBe(false);
  });
});
