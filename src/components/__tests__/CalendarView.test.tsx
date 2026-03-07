import "@testing-library/jest-dom";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { STORAGE_KEYS } from "../../constants/storage";
import type { Column } from "../../board/types";
import { renderApp } from "../../test/renderApp";

function makeColumn(
  id: string,
  title: string,
  cards: Column["cards"] = [],
): Column {
  const now = Date.now();
  return { id, title, createdAt: now, updatedAt: now, cards };
}

function makeCard(
  id: string,
  number: number,
  title: string,
  dueDate: string | null = null,
) {
  const now = Date.now();
  return {
    id,
    number,
    title,
    description: "",
    ticketTypeId: null,
    dueDate,
    createdAt: now,
    updatedAt: now,
    columnHistory: [{ columnId: "col-1", enteredAt: now }],
  };
}

function seedBoard(columns: Column[]) {
  localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns }));
  localStorage.setItem(STORAGE_KEYS.VIEW_MODE, "calendar");
}

describe("CalendarView", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows empty state when no cards have due dates", () => {
    seedBoard([makeColumn("col-1", "Todo", [makeCard("c1", 1, "Task")])]);
    renderApp();
    expect(screen.getByText(/no cards with due dates/i)).toBeInTheDocument();
  });

  it("renders calendar grid when cards have due dates", () => {
    seedBoard([
      makeColumn("col-1", "Todo", [makeCard("c1", 1, "Task", "2025-06-15")]),
    ]);
    renderApp();
    expect(screen.getByTestId("calendar-grid")).toBeInTheDocument();
  });

  it("displays card title on its due date cell", () => {
    seedBoard([
      makeColumn("col-1", "Todo", [
        makeCard("c1", 1, "Important Task", "2025-06-15"),
      ]),
    ]);
    renderApp();
    expect(screen.getByText("Important Task")).toBeInTheDocument();
  });

  it("renders day-of-week headers", () => {
    seedBoard([
      makeColumn("col-1", "Todo", [makeCard("c1", 1, "Task", "2025-06-15")]),
    ]);
    renderApp();
    for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it("shows current month label", () => {
    seedBoard([
      makeColumn("col-1", "Todo", [makeCard("c1", 1, "Task", "2025-06-15")]),
    ]);
    renderApp();
    expect(screen.getByText(/june 2025/i)).toBeInTheDocument();
  });

  it("navigates to next month", async () => {
    seedBoard([
      makeColumn("col-1", "Todo", [makeCard("c1", 1, "Task", "2025-06-15")]),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    await user.click(screen.getByLabelText("Next month"));
    expect(screen.getByText(/july 2025/i)).toBeInTheDocument();
  });

  it("navigates to previous month", async () => {
    seedBoard([
      makeColumn("col-1", "Todo", [makeCard("c1", 1, "Task", "2025-06-15")]),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    await user.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText(/may 2025/i)).toBeInTheDocument();
  });

  it("today button returns to current month", async () => {
    seedBoard([
      makeColumn("col-1", "Todo", [makeCard("c1", 1, "Task", "2025-06-15")]),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    await user.click(screen.getByLabelText("Next month"));
    expect(screen.getByText(/july 2025/i)).toBeInTheDocument();

    await user.click(screen.getByText("Today"));
    expect(screen.getByText(/june 2025/i)).toBeInTheDocument();
  });

  it("displays multiple cards on the same date", () => {
    seedBoard([
      makeColumn("col-1", "Todo", [
        makeCard("c1", 1, "Task A", "2025-06-15"),
        makeCard("c2", 2, "Task B", "2025-06-15"),
      ]),
    ]);
    renderApp();
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Task B")).toBeInTheDocument();
  });

  it("shows cards from multiple columns", () => {
    seedBoard([
      makeColumn("col-1", "Todo", [
        makeCard("c1", 1, "Todo Task", "2025-06-10"),
      ]),
      makeColumn("col-2", "Done", [
        makeCard("c2", 2, "Done Task", "2025-06-20"),
      ]),
    ]);
    renderApp();
    expect(screen.getByText("Todo Task")).toBeInTheDocument();
    expect(screen.getByText("Done Task")).toBeInTheDocument();
  });

  it("does not show cards without due dates on the grid", () => {
    seedBoard([
      makeColumn("col-1", "Todo", [
        makeCard("c1", 1, "Has Date", "2025-06-15"),
        makeCard("c2", 2, "No Date", null),
      ]),
    ]);
    renderApp();
    const grid = screen.getByTestId("calendar-grid");
    expect(within(grid).getByText("Has Date")).toBeInTheDocument();
    expect(within(grid).queryByText("No Date")).not.toBeInTheDocument();
  });

  it("wraps around year boundary when navigating months", async () => {
    vi.setSystemTime(new Date(2025, 0, 15)); // January 2025

    seedBoard([
      makeColumn("col-1", "Todo", [makeCard("c1", 1, "Task", "2024-12-10")]),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    expect(screen.getByText(/january 2025/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText(/december 2024/i)).toBeInTheDocument();
  });
});
