import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { CardList } from "../CardList";
import type { Card } from "../../../board/types";
import { makeCard } from "../../../test/builders";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockColumns = vi.fn<() => { id: string; title: string }[]>(() => [
  { id: "col-1", title: "To Do" },
  { id: "col-2", title: "Done" },
]);
const mockMatchingCardIds = vi.fn<() => Set<string>>(() => new Set());

vi.mock("../../../board/useBoard", () => ({
  useBoard: () => ({
    columns: mockColumns(),
    matchingCardIds: mockMatchingCardIds(),
  }),
}));

vi.mock("../../../theme/useTheme", () => ({
  useTheme: () => ({ cardTypes: [] }),
}));

vi.mock("@dnd-kit/core", () => ({
  useDroppable: () => ({ setNodeRef: () => {}, isOver: false }),
  useDndContext: () => ({ over: null, active: null }),
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  verticalListSortingStrategy: {},
}));

vi.mock("../SortableCardItem", () => ({
  SortableCardItem: (props: {
    card: Card;
    canDrag: boolean;
    isSearchMatch: boolean;
    autoFocus: boolean;
    density: string;
    columnId: string;
  }) => (
    <div
      data-testid={`stub-card-${props.card.id}`}
      data-can-drag={String(props.canDrag)}
      data-is-search-match={String(props.isSearchMatch)}
      data-auto-focus={String(props.autoFocus)}
      data-density={props.density}
      data-column-id={props.columnId}
    >
      {props.card.title}
    </div>
  ),
}));

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const defaultProps = {
  cards: [] as Card[],
  onCopy: vi.fn(),
  onArchive: vi.fn(),
  onUpdate: vi.fn(),
  onOpenDetail: vi.fn(),
  density: "medium" as const,
  columnId: "col-1",
};

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("CardList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockColumns.mockReturnValue([
      { id: "col-1", title: "To Do" },
      { id: "col-2", title: "Done" },
    ]);
    mockMatchingCardIds.mockReturnValue(new Set());
  });

  // --- Empty state ---

  it("renders 'No cards yet' when cards array is empty", () => {
    render(<CardList {...defaultProps} cards={[]} />);
    expect(screen.getByText("No cards yet")).toBeInTheDocument();
  });

  it("does not render any card items when empty", () => {
    render(<CardList {...defaultProps} cards={[]} />);
    expect(screen.queryByTestId(/^stub-card-/)).not.toBeInTheDocument();
  });

  // --- Card rendering ---

  it("renders one item per card", () => {
    const cards = [
      makeCard({ id: "a", title: "Alpha" }),
      makeCard({ id: "b", title: "Beta" }),
    ];
    render(<CardList {...defaultProps} cards={cards} />);
    expect(screen.getByTestId("stub-card-a")).toHaveTextContent("Alpha");
    expect(screen.getByTestId("stub-card-b")).toHaveTextContent("Beta");
  });

  it("does not show 'No cards yet' when cards exist", () => {
    render(
      <CardList
        {...defaultProps}
        cards={[makeCard({ id: "x", title: "X" })]}
      />,
    );
    expect(screen.queryByText("No cards yet")).not.toBeInTheDocument();
  });

  // --- Data attributes ---

  it("sets data-card-density on the list container", () => {
    render(<CardList {...defaultProps} density="small" cards={[]} />);
    expect(screen.getByTestId("card-list")).toHaveAttribute(
      "data-card-density",
      "small",
    );
  });

  it("sets data-droppable-column on the list container", () => {
    render(<CardList {...defaultProps} columnId="col-42" cards={[]} />);
    expect(screen.getByTestId("card-list")).toHaveAttribute(
      "data-droppable-column",
      "col-42",
    );
  });

  // --- Density forwarding ---

  it("passes density to each card", () => {
    const cards = [makeCard({ id: "c", title: "Card C" })];
    render(<CardList {...defaultProps} density="large" cards={cards} />);
    expect(screen.getByTestId("stub-card-c")).toHaveAttribute(
      "data-density",
      "large",
    );
  });

  // --- Search match ---

  it("sets isSearchMatch=true for cards in matchingCardIds", () => {
    mockMatchingCardIds.mockReturnValue(new Set(["m1"]));
    const cards = [
      makeCard({ id: "m1", title: "Match" }),
      makeCard({ id: "m2", title: "No match" }),
    ];
    render(<CardList {...defaultProps} cards={cards} />);
    expect(screen.getByTestId("stub-card-m1")).toHaveAttribute(
      "data-is-search-match",
      "true",
    );
    expect(screen.getByTestId("stub-card-m2")).toHaveAttribute(
      "data-is-search-match",
      "false",
    );
  });

  // --- canDrag logic ---

  it("sets canDrag=true when multiple cards exist", () => {
    mockColumns.mockReturnValue([{ id: "col-1", title: "Only" }]);
    const cards = [
      makeCard({ id: "d1", title: "D1" }),
      makeCard({ id: "d2", title: "D2" }),
    ];
    render(<CardList {...defaultProps} cards={cards} />);
    expect(screen.getByTestId("stub-card-d1")).toHaveAttribute(
      "data-can-drag",
      "true",
    );
  });

  it("sets canDrag=true when multiple columns exist even with single card", () => {
    mockColumns.mockReturnValue([
      { id: "col-1", title: "A" },
      { id: "col-2", title: "B" },
    ]);
    const cards = [makeCard({ id: "e1", title: "E1" })];
    render(<CardList {...defaultProps} cards={cards} />);
    expect(screen.getByTestId("stub-card-e1")).toHaveAttribute(
      "data-can-drag",
      "true",
    );
  });

  it("sets canDrag=false when single card and single column", () => {
    mockColumns.mockReturnValue([{ id: "col-1", title: "Only" }]);
    const cards = [makeCard({ id: "f1", title: "F1" })];
    render(<CardList {...defaultProps} cards={cards} />);
    expect(screen.getByTestId("stub-card-f1")).toHaveAttribute(
      "data-can-drag",
      "false",
    );
  });

  // --- autoFocus ---

  it("passes autoFocus=true to the matching card", () => {
    const cards = [
      makeCard({ id: "g1", title: "G1" }),
      makeCard({ id: "g2", title: "G2" }),
    ];
    render(
      <CardList
        {...defaultProps}
        cards={cards}
        autoFocusCardId="g2"
        onAutoFocused={vi.fn()}
      />,
    );
    expect(screen.getByTestId("stub-card-g1")).toHaveAttribute(
      "data-auto-focus",
      "false",
    );
    expect(screen.getByTestId("stub-card-g2")).toHaveAttribute(
      "data-auto-focus",
      "true",
    );
  });

  it("passes autoFocus=false to all cards when autoFocusCardId is null", () => {
    const cards = [makeCard({ id: "h1", title: "H1" })];
    render(<CardList {...defaultProps} cards={cards} autoFocusCardId={null} />);
    expect(screen.getByTestId("stub-card-h1")).toHaveAttribute(
      "data-auto-focus",
      "false",
    );
  });
});
