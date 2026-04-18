import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { MouseSensor, TouchSensor } from "@dnd-kit/core";
import { Board } from "../Board";
import type { Column, Card } from "../../../board/types";
import { makeCard, makeColumn } from "../../../test/builders";

// vi.hoisted runs before vi.mock so mockUseSensor is available inside the factory
const { mockUseSensor } = vi.hoisted(() => ({
  mockUseSensor: vi.fn(() => ({})),
}));

let mockIsMobile = false;

vi.mock("../../../hooks", () => ({
  useIsMobile: () => mockIsMobile,
  useSwipeNavigation: () => ({ onTouchStart: vi.fn(), onTouchEnd: vi.fn() }),
}));

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

const mockColumnOrderLocked = vi.fn(() => false);

vi.mock("../../../theme/useTheme", () => ({
  useTheme: () => ({
    cardDensity: "medium",
    cardTypes: [],
    columnOrderLocked: mockColumnOrderLocked(),
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
  MouseSensor: class {},
  TouchSensor: class {},
  closestCorners: vi.fn(),
  useSensor: mockUseSensor,
  useSensors: () => [],
}));

vi.mock("@dnd-kit/sortable", () => ({
  SortableContext: ({ children }: { children: React.ReactNode }) => (
    <>{children}</>
  ),
  sortableKeyboardCoordinates: vi.fn(),
  horizontalListSortingStrategy: {},
  verticalListSortingStrategy: {},
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
    disabled?: boolean;
    onOpenDetail?: (cardId: string) => void;
  }) => {
    capturedOnOpenDetail = props.onOpenDetail;
    return (
      <div
        data-testid={`stub-col-${props.id}`}
        data-can-drag={String(props.canDrag)}
        data-disabled={String(props.disabled ?? false)}
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

let capturedOnAddColumn: (() => void) | undefined;
let capturedOnTabClick: ((index: number) => void) | undefined;

vi.mock("../BoardColumnTabs", () => ({
  BoardColumnTabs: (props: {
    columns: Column[];
    activeIndex: number;
    onTabClick: (index: number) => void;
    onAddColumn: () => void;
  }) => {
    capturedOnTabClick = props.onTabClick;
    capturedOnAddColumn = props.onAddColumn;
    return (
      <div data-testid="stub-tab-bar" data-active-index={props.activeIndex}>
        {props.columns.map((col, i) => (
          <button
            key={col.id}
            data-testid={`stub-tab-${col.id}`}
            onClick={() => props.onTabClick(i)}
          >
            {col.title}
          </button>
        ))}
        <button data-testid="stub-tab-add-column" onClick={props.onAddColumn}>
          + Add Column
        </button>
      </div>
    );
  },
}));

vi.mock("../Column", () => ({
  Column: (props: { id: string; title: string; fullWidth?: boolean }) => (
    <div
      data-testid={`stub-column-${props.id}`}
      data-full-width={String(props.fullWidth ?? false)}
    >
      {props.title}
    </div>
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
    mockColumnOrderLocked.mockReturnValue(false);
    mockIsMobile = false;
    capturedOnOpenDetail = undefined;
    capturedOnTabClick = undefined;
    capturedOnAddColumn = undefined;
  });

  // --- Sensor configuration (regression for v1.49.1 PointerSensor bug) ---

  it("registers MouseSensor with distance: 5 (no delay) for desktop drag", () => {
    // Sensors live in DesktopBoard, which only renders when columns exist
    mockColumns.mockReturnValue([makeColumn({ id: "c1", title: "To Do" })]);
    render(<Board />);
    const mouseCall = mockUseSensor.mock.calls.find(
      ([cls]) => cls === MouseSensor,
    );
    expect(mouseCall).toBeDefined();
    expect(mouseCall![1]).toEqual({ activationConstraint: { distance: 5 } });
  });

  it("registers TouchSensor with delay: 200 and tolerance: 5 for mobile drag", () => {
    // Sensors live in DesktopBoard, which only renders when columns exist
    mockColumns.mockReturnValue([makeColumn({ id: "c1", title: "To Do" })]);
    render(<Board />);
    const touchCall = mockUseSensor.mock.calls.find(
      ([cls]) => cls === TouchSensor,
    );
    expect(touchCall).toBeDefined();
    expect(touchCall![1]).toEqual({
      activationConstraint: { delay: 200, tolerance: 5 },
    });
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

  // --- columnOrderLocked ---

  it("sets canDrag=false and disabled=true when columnOrderLocked is true", () => {
    mockColumnOrderLocked.mockReturnValue(true);
    mockColumns.mockReturnValue([
      makeColumn({ id: "c1", title: "A" }),
      makeColumn({ id: "c2", title: "B" }),
    ]);
    render(<Board />);
    expect(screen.getByTestId("stub-col-c1")).toHaveAttribute(
      "data-can-drag",
      "false",
    );
    expect(screen.getByTestId("stub-col-c1")).toHaveAttribute(
      "data-disabled",
      "true",
    );
  });

  it("sets canDrag=true and disabled=false when columnOrderLocked is false", () => {
    mockColumnOrderLocked.mockReturnValue(false);
    mockColumns.mockReturnValue([
      makeColumn({ id: "c1", title: "A" }),
      makeColumn({ id: "c2", title: "B" }),
    ]);
    render(<Board />);
    expect(screen.getByTestId("stub-col-c1")).toHaveAttribute(
      "data-can-drag",
      "true",
    );
    expect(screen.getByTestId("stub-col-c1")).toHaveAttribute(
      "data-disabled",
      "false",
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

  // --- Mobile layout ---

  it("renders tab bar on mobile when columns exist", () => {
    mockIsMobile = true;
    mockColumns.mockReturnValue([
      makeColumn({ id: "c1", title: "To Do" }),
      makeColumn({ id: "c2", title: "Done" }),
    ]);
    render(<Board />);
    expect(screen.getByTestId("stub-tab-bar")).toBeInTheDocument();
  });

  it("does not render tab bar on mobile when board is empty", () => {
    mockIsMobile = true;
    mockColumns.mockReturnValue([]);
    render(<Board />);
    expect(screen.queryByTestId("stub-tab-bar")).not.toBeInTheDocument();
    expect(screen.getByTestId("stub-add-column")).toBeInTheDocument();
  });

  it("renders the first column as full-width on mobile", () => {
    mockIsMobile = true;
    mockColumns.mockReturnValue([
      makeColumn({ id: "c1", title: "To Do" }),
      makeColumn({ id: "c2", title: "Done" }),
    ]);
    render(<Board />);
    const col = screen.getByTestId("stub-column-c1");
    expect(col).toBeInTheDocument();
    expect(col).toHaveAttribute("data-full-width", "true");
  });

  it("does not render SortableColumnItems on mobile", () => {
    mockIsMobile = true;
    mockColumns.mockReturnValue([makeColumn({ id: "c1", title: "To Do" })]);
    render(<Board />);
    expect(screen.queryByTestId("stub-col-c1")).not.toBeInTheDocument();
  });

  it("switching tabs shows the selected column on mobile", async () => {
    mockIsMobile = true;
    mockColumns.mockReturnValue([
      makeColumn({ id: "c1", title: "To Do" }),
      makeColumn({ id: "c2", title: "Done" }),
    ]);
    render(<Board />);
    expect(screen.getByTestId("stub-column-c1")).toBeInTheDocument();
    act(() => {
      capturedOnTabClick?.(1);
    });
    expect(screen.getByTestId("stub-column-c2")).toBeInTheDocument();
    expect(screen.queryByTestId("stub-column-c1")).not.toBeInTheDocument();
  });

  it("calls addColumn when tab bar add column is clicked on mobile", async () => {
    mockIsMobile = true;
    mockColumns.mockReturnValue([makeColumn({ id: "c1", title: "To Do" })]);
    render(<Board />);
    act(() => {
      capturedOnAddColumn?.();
    });
    expect(mockAddColumn).toHaveBeenCalledWith("New Column");
  });

  it("does not render tab bar on desktop", () => {
    mockIsMobile = false;
    mockColumns.mockReturnValue([makeColumn({ id: "c1", title: "To Do" })]);
    render(<Board />);
    expect(screen.queryByTestId("stub-tab-bar")).not.toBeInTheDocument();
    expect(screen.getByTestId("stub-col-c1")).toBeInTheDocument();
  });
});
