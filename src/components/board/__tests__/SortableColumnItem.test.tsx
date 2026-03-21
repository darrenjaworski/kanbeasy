import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { SortableColumnItem } from "../SortableColumnItem";
import { makeColumn } from "../../../test/builders";

const mockUseSortable = vi.fn();

vi.mock("@dnd-kit/sortable", () => ({
  useSortable: (...args: unknown[]) => mockUseSortable(...args),
}));

vi.mock("@dnd-kit/utilities", () => ({
  CSS: { Transform: { toString: () => undefined } },
}));

vi.mock("../Column", () => ({
  Column: (props: {
    id: string;
    title: string;
    canDrag: boolean;
    isDragging: boolean;
  }) => (
    <div
      data-testid={`stub-column-${props.id}`}
      data-can-drag={String(props.canDrag)}
      data-is-dragging={String(props.isDragging)}
    >
      {props.title}
    </div>
  ),
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

const col = makeColumn({ id: "col-1", title: "To Do" });

const baseProps = {
  id: col.id,
  title: col.title,
  cards: col.cards,
  canDrag: true,
};

describe("SortableColumnItem", () => {
  it("passes disabled=false to useSortable by default", () => {
    mockUseSortable.mockReturnValue(sortableDefaults());
    render(<SortableColumnItem {...baseProps} />);
    expect(mockUseSortable).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: undefined }),
    );
  });

  it("passes disabled=true to useSortable when disabled prop is true", () => {
    mockUseSortable.mockReturnValue(sortableDefaults());
    render(<SortableColumnItem {...baseProps} disabled={true} />);
    expect(mockUseSortable).toHaveBeenCalledWith(
      expect.objectContaining({ disabled: true }),
    );
  });

  it("forwards canDrag=false to Column", () => {
    mockUseSortable.mockReturnValue(sortableDefaults());
    render(<SortableColumnItem {...baseProps} canDrag={false} />);
    expect(screen.getByTestId("stub-column-col-1")).toHaveAttribute(
      "data-can-drag",
      "false",
    );
  });

  it("forwards canDrag=true to Column", () => {
    mockUseSortable.mockReturnValue(sortableDefaults());
    render(<SortableColumnItem {...baseProps} canDrag={true} />);
    expect(screen.getByTestId("stub-column-col-1")).toHaveAttribute(
      "data-can-drag",
      "true",
    );
  });

  it("forwards isDragging=true to Column", () => {
    mockUseSortable.mockReturnValue(sortableDefaults({ isDragging: true }));
    render(<SortableColumnItem {...baseProps} />);
    expect(screen.getByTestId("stub-column-col-1")).toHaveAttribute(
      "data-is-dragging",
      "true",
    );
  });
});
