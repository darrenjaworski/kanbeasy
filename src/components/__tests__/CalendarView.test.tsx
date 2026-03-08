import "@testing-library/jest-dom";
import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { STORAGE_KEYS } from "../../constants/storage";
import type { Column } from "../../board/types";
import { renderApp } from "../../test/renderApp";
import { makeCard, makeColumn } from "../../test/builders";
import { seedBoard as seedBoardDb, seedKv } from "../../utils/db";

function seedBoard(columns: Column[]) {
  seedBoardDb({ columns, archive: [] });
  seedKv(STORAGE_KEYS.VIEW_MODE, "calendar");
}

describe("CalendarView", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows empty state when no cards have due dates", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [makeCard({ id: "c1", number: 1, title: "Task" })],
      }),
    ]);
    renderApp();
    expect(screen.getByText(/no cards with due dates/i)).toBeInTheDocument();
  });

  it("renders calendar grid when cards have due dates", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    renderApp();
    expect(screen.getByTestId("calendar-grid")).toBeInTheDocument();
  });

  it("displays card title on its due date cell", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Important Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    renderApp();
    expect(screen.getByText("Important Task")).toBeInTheDocument();
  });

  it("renders day-of-week headers", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    renderApp();
    for (const day of ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]) {
      expect(screen.getByText(day)).toBeInTheDocument();
    }
  });

  it("shows current month label", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    renderApp();
    expect(screen.getByText(/june 2025/i)).toBeInTheDocument();
  });

  it("navigates to next month", async () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    await user.click(screen.getByLabelText("Next month"));
    expect(screen.getByText(/july 2025/i)).toBeInTheDocument();
  });

  it("navigates to previous month", async () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    await user.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText(/may 2025/i)).toBeInTheDocument();
  });

  it("today button returns to current month", async () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
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
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Task A",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c2",
            number: 2,
            title: "Task B",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    renderApp();
    expect(screen.getByText("Task A")).toBeInTheDocument();
    expect(screen.getByText("Task B")).toBeInTheDocument();
  });

  it("shows cards from multiple columns", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Todo Task",
            dueDate: "2025-06-10",
          }),
        ],
      }),
      makeColumn({
        id: "col-2",
        title: "Done",
        cards: [
          makeCard({
            id: "c2",
            number: 2,
            title: "Done Task",
            dueDate: "2025-06-20",
          }),
        ],
      }),
    ]);
    renderApp();
    expect(screen.getByText("Todo Task")).toBeInTheDocument();
    expect(screen.getByText("Done Task")).toBeInTheDocument();
  });

  it("does not show cards without due dates on the grid", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Has Date",
            dueDate: "2025-06-15",
          }),
          makeCard({ id: "c2", number: 2, title: "No Date", dueDate: null }),
        ],
      }),
    ]);
    renderApp();
    const grid = screen.getByTestId("calendar-grid");
    expect(within(grid).getByText("Has Date")).toBeInTheDocument();
    expect(within(grid).queryByText("No Date")).not.toBeInTheDocument();
  });

  it("wraps around year boundary when navigating months", async () => {
    vi.setSystemTime(new Date(2025, 0, 15)); // January 2025

    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Task",
            dueDate: "2024-12-10",
          }),
        ],
      }),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    expect(screen.getByText(/january 2025/i)).toBeInTheDocument();
    await user.click(screen.getByLabelText("Previous month"));
    expect(screen.getByText(/december 2024/i)).toBeInTheDocument();
  });

  it("opens card detail modal when clicking a card", async () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Clickable Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    const grid = screen.getByTestId("calendar-grid");
    await user.click(within(grid).getByText("Clickable Task"));

    // Card detail modal should open with the card title and due date field
    expect(screen.getByTestId("card-detail-due-date")).toBeInTheDocument();
  });

  it("highlights matching cards when search query is entered", async () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Alpha Task",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c2",
            number: 2,
            title: "Beta Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    const searchInput = screen.getByPlaceholderText(/search/i);
    await user.type(searchInput, "Alpha");

    const grid = screen.getByTestId("calendar-grid");
    const alphaBtn = within(grid).getByText("Alpha Task").closest("button")!;
    const betaBtn = within(grid).getByText("Beta Task").closest("button")!;

    expect(alphaBtn).toHaveAttribute("data-search-highlight", "true");
    expect(betaBtn).not.toHaveAttribute("data-search-highlight");
  });

  it("shows match badge on a day with more than 4 cards and a search match", async () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Alpha",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c2",
            number: 2,
            title: "Bravo",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c3",
            number: 3,
            title: "Charlie",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c4",
            number: 4,
            title: "Delta",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c5",
            number: 5,
            title: "Echo",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    await user.type(screen.getByPlaceholderText(/search/i), "Echo");

    expect(screen.getByTestId("calendar-match-badge")).toHaveTextContent(
      "1 match",
    );
  });

  it("does not show match badge when day has 4 or fewer cards", async () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Alpha",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c2",
            number: 2,
            title: "Bravo",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    await user.type(screen.getByPlaceholderText(/search/i), "Alpha");

    expect(
      screen.queryByTestId("calendar-match-badge"),
    ).not.toBeInTheDocument();
  });

  it("shows plural matches text when multiple cards match", async () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Alpha One",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c2",
            number: 2,
            title: "Alpha Two",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c3",
            number: 3,
            title: "Bravo",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c4",
            number: 4,
            title: "Charlie",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c5",
            number: 5,
            title: "Delta",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    await user.type(screen.getByPlaceholderText(/search/i), "Alpha");

    expect(screen.getByTestId("calendar-match-badge")).toHaveTextContent(
      "2 matches",
    );
  });
});
