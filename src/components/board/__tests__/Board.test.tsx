import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Board } from "../Board";
import type { Column, Card } from "../../../board/types";
import { makeCard, makeColumn } from "../../../test/builders";

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

const mockAddColumn = vi.fn();
const mockSetColumns = vi.fn();
const mockUpdateCard = vi.fn();
const mockMoveCard = vi.fn();
const mockArchiveCard = vi.fn();
const mockColumns = vi.fn<() => Column[]>(() => []);

vi.mock("../../../board/useBoard", () => ({
  useBoard: () => ({
    columns: mockColumns(),
    addColumn: mockAddColumn,
    setColumns: mockSetColumns,
    updateCard: mockUpdateCard,
    moveCard: mockMoveCard,
    archiveCard: mockArchiveCard,
  }),
}));

vi.mock("../../../theme/useTheme", () => ({
  useTheme: () => ({
    cardDensity: "medium",
    cardTypes: [],
  }),
}));

vi.mock("../../../board/useBoardDragAndDrop", () => ({
  useBoardDragAndDrop: () => ({
    activeType: null,
    activeCard: null,
    handleDragStart: vi.fn(),
    handleDragEnd: vi.fn(),
    handleDragCancel: vi.fn(),
  }),
}));

// Stub @dnd-kit
vi.mock("@dnd-kit/core", () => ({
  DndContext: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  KeyboardSensor: class {},
  PointerSensor: class {},
  closestCorners: vi.fn(),
  useSensor: () => ({}),
  useSensors: () => [],
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  sortableKeyboardCoordinates: vi.fn(),
  horizontalListSortingStrategy: {},
}));

vi.mock("@dnd-kit/modifiers", () => ({
  restrictToHorizontalAxis: vi.fn(),
}));

// Stub child components
let capturedOnOpenDetail: ((cardId: string) => void) | undefined;

vi.mock("../SortableColumnItem", () => ({
  SortableColumnItem: (props: {
    id: string;
    title: string;
    cards: Card[];
    canDrag: boolean;
    onOpenDetail?: (cardId: string) => void;
  }) => {
    capturedOnOpenDetail = props.onOpenDetail;
    return (
      <div
        data-testid={`stub-col-${props.id}`}
        data-can-drag={String(props.canDrag)}
        data-title={props.title}
      >
        {props.title}
      </div>
    );
  },
}));

vi.mock("../AddColumn", () => ({
  AddColumn: ({ handleOnClick }: { handleOnClick: () => void }) => (
    <button data-testid="stub-add-column" onClick={handleOnClick}>
      Add Column
    </button>
  ),
}));

vi.mock("../BoardDragOverlay", () => ({
  BoardDragOverlay: () => <div data-testid="stub-drag-overlay" />,
}));

vi.mock("../BoardScrollGradients", () => ({
  BoardScrollGradients: () => <div data-testid="stub-scroll-gradients" />,
}));

vi.mock("../CardDetailModal", () => ({
  CardDetailModal: (props: {
    open: boolean;
    onClose: () => void;
    onArchive: () => void;
    card: Card;
  }) => {
    return props.open ? (
      <div data-testid="stub-detail-modal">
        <span data-testid="modal-card-title">{props.card.title}</span>
        <button data-testid="modal-close" onClick={props.onClose}>
          Close
        </button>
        <button data-testid="modal-archive" onClick={props.onArchive}>
          Archive
        </button>
      </div>
    ) : null;
  },
}));

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("Board", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockColumns.mockReturnValue([]);
    capturedOnOpenDetail = undefined;
  });

  // --- Empty state ---

  it("renders AddColumn when there are no columns", () => {
    render(<Board />);
    expect(screen.getByTestId("stub-add-column")).toBeInTheDocument();
    expect(screen.queryByTestId(/^stub-col-/)).not.toBeInTheDocument();
  });

  // --- Column rendering ---

  it("renders one item per column plus AddColumn", () => {
    mockColumns.mockReturnValue([
      makeColumn({ id: "c1", title: "To Do" }),
      makeColumn({ id: "c2", title: "Done" }),
    ]);
    render(<Board />);
    expect(screen.getByTestId("stub-col-c1")).toHaveTextContent("To Do");
    expect(screen.getByTestId("stub-col-c2")).toHaveTextContent("Done");
    expect(screen.getByTestId("stub-add-column")).toBeInTheDocument();
  });

  // --- canDrag ---

  it("sets canDrag=false for a single column", () => {
    mockColumns.mockReturnValue([makeColumn({ id: "c1", title: "Only" })]);
    render(<Board />);
    expect(screen.getByTestId("stub-col-c1")).toHaveAttribute(
      "data-can-drag",
      "false",
    );
  });

  it("sets canDrag=true when multiple columns exist", () => {
    mockColumns.mockReturnValue([
      makeColumn({ id: "c1", title: "A" }),
      makeColumn({ id: "c2", title: "B" }),
    ]);
    render(<Board />);
    expect(screen.getByTestId("stub-col-c1")).toHaveAttribute(
      "data-can-drag",
      "true",
    );
  });

  // --- AddColumn ---

  it("calls addColumn with 'New Column' on AddColumn click", async () => {
    render(<Board />);
    await userEvent.click(screen.getByTestId("stub-add-column"));
    expect(mockAddColumn).toHaveBeenCalledWith("New Column");
  });

  // --- Detail modal ---

  it("does not render detail modal by default", () => {
    mockColumns.mockReturnValue([makeColumn({ id: "c1", title: "Col" })]);
    render(<Board />);
    expect(screen.queryByTestId("stub-detail-modal")).not.toBeInTheDocument();
  });

  it("opens detail modal when onOpenDetail is called from a column", () => {
    const card = makeCard({ id: "card-1", title: "Task A" });
    mockColumns.mockReturnValue([
      makeColumn({ id: "c1", title: "Col", cards: [card] }),
    ]);
    render(<Board />);
    // Trigger the onOpenDetail callback captured from SortableColumnItem
    act(() => {
      capturedOnOpenDetail?.("card-1");
    });
    expect(screen.getByTestId("stub-detail-modal")).toBeInTheDocument();
    expect(screen.getByTestId("modal-card-title")).toHaveTextContent("Task A");
  });

  it("closes detail modal on close", async () => {
    const card = makeCard({ id: "card-1", title: "Task A" });
    mockColumns.mockReturnValue([
      makeColumn({ id: "c1", title: "Col", cards: [card] }),
    ]);
    render(<Board />);
    act(() => {
      capturedOnOpenDetail?.("card-1");
    });
    expect(screen.getByTestId("stub-detail-modal")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("modal-close"));
    expect(screen.queryByTestId("stub-detail-modal")).not.toBeInTheDocument();
  });

  it("calls archiveCard and closes modal on archive", async () => {
    const card = makeCard({ id: "card-1", title: "Task A" });
    mockColumns.mockReturnValue([
      makeColumn({ id: "c1", title: "Col", cards: [card] }),
    ]);
    render(<Board />);
    act(() => {
      capturedOnOpenDetail?.("card-1");
    });
    await userEvent.click(screen.getByTestId("modal-archive"));
    expect(mockArchiveCard).toHaveBeenCalledWith("c1", "card-1");
    expect(screen.queryByTestId("stub-detail-modal")).not.toBeInTheDocument();
  });
});
