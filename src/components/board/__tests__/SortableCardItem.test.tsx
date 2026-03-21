import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { SortableCardItem } from "../SortableCardItem";
import { makeCard } from "../../../test/builders";

let mockIsMobile = false;

vi.mock("../../../hooks", () => ({
  useIsMobile: () => mockIsMobile,
  useInlineEdit: () => ({ onKeyDown: vi.fn(), onBlur: vi.fn() }),
}));

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
  cardTypes: [],
};

describe("SortableCardItem", () => {
  beforeEach(() => {
    mockIsMobile = false;
  });

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

  it("renders textarea on desktop", () => {
    mockUseSortable.mockReturnValue(sortableDefaults());
    render(<SortableCardItem {...baseProps} />);
    expect(
      screen.getByRole("textbox", { name: /card content/i }),
    ).toBeInTheDocument();
    // card-content is a textarea, not a button, on desktop
    expect(screen.getByTestId("card-content-0").tagName).toBe("TEXTAREA");
  });

  it("renders a tappable button instead of textarea on mobile", () => {
    mockIsMobile = true;
    mockUseSortable.mockReturnValue(sortableDefaults());
    render(<SortableCardItem {...baseProps} />);
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
    expect(screen.getByTestId("card-content-0")).toBeInTheDocument();
  });

  it("calls onOpenDetail when card body is tapped on mobile", async () => {
    mockIsMobile = true;
    mockUseSortable.mockReturnValue(sortableDefaults());
    const onOpenDetail = vi.fn();
    render(<SortableCardItem {...baseProps} onOpenDetail={onOpenDetail} />);
    await userEvent.click(screen.getByTestId("card-content-0"));
    expect(onOpenDetail).toHaveBeenCalledTimes(1);
  });
});
