import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { SortableCardItem } from "../SortableCardItem";
import { makeCard } from "../../../test/builders";

// `useSortable` is invoked exactly once per SortableCardItem render, so the
// mock's call count is a faithful proxy for how many times the component (and
// therefore its whole subtree) rendered — observed purely through re-rendering.
const mockUseSortable = vi.fn();

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: (...args: unknown[]) => mockUseSortable(...args),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

vi.mock("../../../hooks", () => ({
  useIsMobile: () => false,
  useInlineEdit: () => ({ onKeyDown: vi.fn(), onBlur: vi.fn() }),
}));

vi.mock("../../../theme/useTheme", () => ({
  useTheme: () => ({ holdToDragEnabled: false }),
}));

function sortableDefaults() {
  return {
    attributes: {},
    listeners: {},
    setActivatorNodeRef: () => {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
  };
}

// Stable prop references defined once — every value is referentially identical
// across parent re-renders, so a memoized child has no reason to re-render.
const stableProps = {
  card: makeCard({ id: "c1", number: 1, title: "Stable card" }),
  onCopy: vi.fn(),
  onArchive: vi.fn(),
  onUpdate: vi.fn(),
  onOpenDetail: vi.fn(),
  density: "medium" as const,
  columnId: "col-1",
  index: 0,
};

function Parent() {
  const [, setTick] = useState(0);
  return (
    <>
      <button type="button" onClick={() => setTick((t) => t + 1)}>
        rerender
      </button>
      <SortableCardItem {...stableProps} />
    </>
  );
}

describe("SortableCardItem memoization", () => {
  beforeEach(() => {
    mockUseSortable.mockClear();
    mockUseSortable.mockReturnValue(sortableDefaults());
  });

  it("does not re-render when its parent re-renders with identical props", async () => {
    render(<Parent />);
    expect(mockUseSortable).toHaveBeenCalledTimes(1);

    await userEvent.click(screen.getByRole("button", { name: /rerender/i }));

    // The parent re-rendered, but the card's props are unchanged, so a properly
    // memoized SortableCardItem should be skipped entirely.
    expect(mockUseSortable).toHaveBeenCalledTimes(1);
  });
});
