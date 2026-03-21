import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { BoardColumnTabs } from "../BoardColumnTabs";
import { makeCard, makeColumn } from "../../../test/builders";

const mockOnTabClick = vi.fn();
const mockOnAddColumn = vi.fn();

function renderTabs(
  columns: Parameters<typeof makeColumn>[0][],
  activeIndex = 0,
) {
  return render(
    <BoardColumnTabs
      columns={columns.map((c) => makeColumn(c))}
      activeIndex={activeIndex}
      onTabClick={mockOnTabClick}
      onAddColumn={mockOnAddColumn}
    />,
  );
}

describe("BoardColumnTabs", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // --- Rendering ---

  it("has tablist role with accessible label", () => {
    renderTabs([{ id: "c1", title: "To Do" }]);
    expect(screen.getByRole("tablist")).toHaveAccessibleName(
      "Column navigation",
    );
  });

  it("renders a tab button for each column", () => {
    renderTabs([
      { id: "c1", title: "To Do" },
      { id: "c2", title: "In Progress" },
      { id: "c3", title: "Done" },
    ]);
    expect(screen.getByRole("tab", { name: /To Do/ })).toBeInTheDocument();
    expect(
      screen.getByRole("tab", { name: /In Progress/ }),
    ).toBeInTheDocument();
    expect(screen.getByRole("tab", { name: /Done/ })).toBeInTheDocument();
  });

  it("renders the Add Column button", () => {
    renderTabs([{ id: "c1", title: "Col" }]);
    expect(
      screen.getByRole("button", { name: "Add column" }),
    ).toBeInTheDocument();
  });

  // --- Active state ---

  it("marks the active tab with aria-selected=true", () => {
    renderTabs(
      [
        { id: "c1", title: "To Do" },
        { id: "c2", title: "Done" },
      ],
      1,
    );
    expect(screen.getByRole("tab", { name: /Done/ })).toHaveAttribute(
      "aria-selected",
      "true",
    );
  });

  it("marks all other tabs with aria-selected=false", () => {
    renderTabs(
      [
        { id: "c1", title: "A" },
        { id: "c2", title: "B" },
        { id: "c3", title: "C" },
      ],
      0,
    );
    expect(screen.getByRole("tab", { name: /B/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
    expect(screen.getByRole("tab", { name: /C/ })).toHaveAttribute(
      "aria-selected",
      "false",
    );
  });

  // --- Card count ---

  it("shows card count inside the tab button", () => {
    const cards = [
      makeCard({ id: "card-1" }),
      makeCard({ id: "card-2" }),
      makeCard({ id: "card-3" }),
    ];
    renderTabs([{ id: "c1", title: "To Do", cards }]);
    const tab = screen.getByRole("tab", { name: /To Do/ });
    expect(tab).toHaveTextContent("3");
  });

  it("shows 0 count for an empty column", () => {
    renderTabs([{ id: "c1", title: "Backlog", cards: [] }]);
    const tab = screen.getByRole("tab", { name: /Backlog/ });
    expect(tab).toHaveTextContent("0");
  });

  // --- Interactions ---

  it("calls onTabClick with the correct index when a tab is clicked", async () => {
    renderTabs([
      { id: "c1", title: "To Do" },
      { id: "c2", title: "In Progress" },
      { id: "c3", title: "Done" },
    ]);
    await userEvent.click(screen.getByRole("tab", { name: /In Progress/ }));
    expect(mockOnTabClick).toHaveBeenCalledWith(1);
  });

  it("calls onTabClick with index 0 when first tab is clicked", async () => {
    renderTabs([
      { id: "c1", title: "First" },
      { id: "c2", title: "Second" },
    ]);
    await userEvent.click(screen.getByRole("tab", { name: /First/ }));
    expect(mockOnTabClick).toHaveBeenCalledWith(0);
  });

  it("calls onAddColumn when Add Column is clicked", async () => {
    renderTabs([{ id: "c1", title: "Col" }]);
    await userEvent.click(screen.getByRole("button", { name: "Add column" }));
    expect(mockOnAddColumn).toHaveBeenCalledOnce();
  });
});
