import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { useCallback, useState } from "react";
import { CardList } from "../CardList";
import { makeCard } from "../../../test/builders";
import type { Card } from "../../../board/types";

// Count real SortableCardItem renders per card id via the one-call-per-render
// useSortable hook. This exercises the real CardList -> memoized
// SortableCardItem path, so it verifies CardList hands down stable props.
const mockUseSortable = vi.fn((args: { id: string }) => ({
  id: args.id,
  attributes: {},
  listeners: {},
  setActivatorNodeRef: () => {},
  setNodeRef: () => {},
  transform: null,
  transition: undefined,
  isDragging: false,
}));

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: (args: { id: string }) => mockUseSortable(args),
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  verticalListSortingStrategy: {},
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
  useDndContext: () => ({ over: null, active: null }),
}));

vi.mock("../../../hooks", () => ({
  useIsMobile: () => false,
  useInlineEdit: () => ({ onKeyDown: vi.fn(), onBlur: vi.fn() }),
}));

vi.mock("../../../theme/useTheme", () => ({
  useTheme: () => ({ holdToDragEnabled: false }),
}));

vi.mock("../../../board/useBoard", () => ({
  useBoard: () => ({
    columns: [{ id: "col-1", title: "To Do" }],
    matchingCardIds: new Set<string>(),
  }),
}));

function renderCountFor(id: string): number {
  return mockUseSortable.mock.calls.filter((c) => c[0].id === id).length;
}

function Harness() {
  const [cards, setCards] = useState<Card[]>(() => [
    makeCard({ id: "a", number: 1, title: "Card A" }),
    makeCard({ id: "b", number: 2, title: "Card B" }),
  ]);

  // Stable callbacks — what a well-behaved parent (Column) is expected to pass.
  const onCopy = useCallback(() => {}, []);
  const onArchive = useCallback(() => {}, []);
  const onUpdate = useCallback(() => {}, []);
  const onOpenDetail = useCallback(() => {}, []);
  const addCard = useCallback(
    () =>
      setCards((prev) => [
        ...prev,
        makeCard({ id: "c", number: 3, title: "Card C" }),
      ]),
    [],
  );

  return (
    <>
      <button type="button" onClick={addCard}>
        add
      </button>
      <CardList
        cards={cards}
        onCopy={onCopy}
        onArchive={onArchive}
        onUpdate={onUpdate}
        onOpenDetail={onOpenDetail}
        density="medium"
        columnId="col-1"
      />
    </>
  );
}

describe("CardList re-render isolation", () => {
  beforeEach(() => {
    mockUseSortable.mockClear();
  });

  it("does not re-render existing cards when a new card is added", async () => {
    render(<Harness />);
    expect(renderCountFor("a")).toBe(1);
    expect(renderCountFor("b")).toBe(1);

    await userEvent.click(screen.getByRole("button", { name: /add/i }));

    // The new card mounts, but the existing cards' props are unchanged, so they
    // must not re-render.
    expect(renderCountFor("c")).toBe(1);
    expect(renderCountFor("a")).toBe(1);
    expect(renderCountFor("b")).toBe(1);
  });
});
