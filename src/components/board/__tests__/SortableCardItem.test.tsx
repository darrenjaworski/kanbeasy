import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SortableCardItem } from "../SortableCardItem";
import { makeCard } from "../../../test/builders";

const mockUseSortable = vi.fn();

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: (...args: unknown[]) => mockUseSortable(...args),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

function sortableDefaults(overrides: Record<string, unknown> = {}) {
  return {
    attributes: {},
    listeners: {},
    setActivatorNodeRef: () => {},
    setNodeRef: () => {},
    transform: null,
    transition: undefined,
    isDragging: false,
    ...overrides,
  };
}

const baseProps = {
  card: makeCard({ id: "c1", number: 1, title: "Test card" }),
  onCopy: vi.fn(),
  onArchive: vi.fn(),
  onUpdate: vi.fn(),
  onOpenDetail: vi.fn(),
  density: "medium" as const,
  columnId: "col-1",
  index: 0,
  ticketTypes: [],
};

describe("SortableCardItem", () => {
  it("renders card controls when not dragging", () => {
    mockUseSortable.mockReturnValue(sortableDefaults({ isDragging: false }));
    render(<SortableCardItem {...baseProps} />);
    expect(screen.getByTestId("card-drag-0")).toBeInTheDocument();
    expect(screen.getByTestId("card-copy-0")).toBeInTheDocument();
    expect(screen.getByTestId("card-archive-0")).toBeInTheDocument();
    expect(screen.getByTestId("card-detail-0")).toBeInTheDocument();
  });

  it("hides card controls when dragging to prevent tooltip flash", () => {
    mockUseSortable.mockReturnValue(sortableDefaults({ isDragging: true }));
    render(<SortableCardItem {...baseProps} />);
    expect(screen.queryByTestId("card-drag-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-copy-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-archive-0")).not.toBeInTheDocument();
    expect(screen.queryByTestId("card-detail-0")).not.toBeInTheDocument();
  });
});
