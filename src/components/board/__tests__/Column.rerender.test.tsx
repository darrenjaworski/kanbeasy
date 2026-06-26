import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import userEvent from "@testing-library/user-event";
import { Column } from "../Column";
import { makeCard } from "../../../test/builders";

// One useSortable call per SortableCardItem render — used as a render counter.
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
  useTheme: () => ({
    cardDensity: "medium",
    columnResizingEnabled: false,
    deleteColumnWarningEnabled: false,
    defaultCardTypeId: undefined,
    cardTypes: [],
    holdToDragEnabled: false,
  }),
}));

// Real providers memoize these (useCallback / useMemo), so the mocks must hand
// back stable references too — otherwise the unstable identities would defeat
// the very memoization this test is verifying.
const mockBoardApi = {
  columns: [{ id: "col-1", title: "To Do" }],
  matchingCardIds: new Set<string>(),
  addCard: vi.fn(() => "new-card-id"),
  removeColumn: vi.fn(),
  archiveCard: vi.fn(),
  updateCard: vi.fn(),
};
const mockClipboardApi = {
  copiedCard: null,
  copyCard: vi.fn(),
  pasteCard: vi.fn(),
};

vi.mock("../../../board/useBoard", () => ({
  useBoard: () => mockBoardApi,
}));

vi.mock("../../../board/useClipboard", () => ({
  useClipboard: () => mockClipboardApi,
}));

vi.mock("../useColumnResize", () => ({
  useColumnResize: () => ({
    width: 320,
    onResizeMouseDown: vi.fn(),
    stepWidth: vi.fn(),
  }),
}));

function renderCountFor(id: string): number {
  return mockUseSortable.mock.calls.filter((c) => c[0].id === id).length;
}

const cards = [
  makeCard({ id: "a", number: 1, title: "Card A" }),
  makeCard({ id: "b", number: 2, title: "Card B" }),
];

describe("Column re-render isolation", () => {
  beforeEach(() => {
    mockUseSortable.mockClear();
  });

  it("does not re-render existing cards when the column itself re-renders", async () => {
    render(<Column id="col-1" title="To Do" cards={cards} index={0} />);
    expect(renderCountFor("a")).toBe(1);
    expect(renderCountFor("b")).toBe(1);

    // Clicking "Add card" updates Column-local state (autoFocusCardId), forcing
    // the Column to re-render. With stable callbacks passed to CardList, the
    // existing cards must not re-render.
    await userEvent.click(
      screen.getByRole("button", { name: /add card to to do/i }),
    );

    expect(renderCountFor("a")).toBe(1);
    expect(renderCountFor("b")).toBe(1);
  });
});
