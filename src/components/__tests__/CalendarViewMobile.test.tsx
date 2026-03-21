import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { STORAGE_KEYS } from "../../constants/storage";
import type { Column } from "../../board/types";
import { renderApp } from "../../test/renderApp";
import { makeCard, makeColumn } from "../../test/builders";
import { seedBoard as seedBoardDb, seedKv } from "../../utils/db";
import type * as HooksModule from "../../hooks";

vi.mock("../../hooks", async (importOriginal) => ({
  ...(await importOriginal<HooksModule>()),
  useIsMobile: () => true,
}));

function seedBoard(columns: Column[]) {
  seedBoardDb({ columns, archive: [] });
  seedKv(STORAGE_KEYS.VIEW_MODE, "calendar");
}

describe("CalendarView mobile day list", () => {
  beforeEach(() => {
    vi.useFakeTimers({ shouldAdvanceTime: true });
    vi.setSystemTime(new Date(2025, 5, 15)); // June 15, 2025
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders a day list, not a calendar grid", () => {
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
    expect(screen.queryByTestId("calendar-grid")).not.toBeInTheDocument();
    expect(screen.queryByText("Sun")).not.toBeInTheDocument();
  });

  it("shows card title in the day list", () => {
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

  it("shows a formatted day label for each day with cards", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Task",
            dueDate: "2025-06-10",
          }),
        ],
      }),
    ]);
    renderApp();
    expect(screen.getByText(/Jun 10/)).toBeInTheDocument();
  });

  it("highlights today with accent styling", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Today Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    renderApp();
    expect(screen.getByText("today")).toBeInTheDocument();
  });

  it("omits days from other months", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "June Task",
            dueDate: "2025-06-15",
          }),
          makeCard({
            id: "c2",
            number: 2,
            title: "July Task",
            dueDate: "2025-07-01",
          }),
        ],
      }),
    ]);
    renderApp();
    expect(screen.getByText("June Task")).toBeInTheDocument();
    expect(screen.queryByText("July Task")).not.toBeInTheDocument();
  });

  it("shows 'no cards due this month' when navigating to an empty month", async () => {
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
    expect(screen.getByText(/no cards due this month/i)).toBeInTheDocument();
  });

  it("shows multiple cards on the same day", () => {
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

  it("lists days in chronological order", () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Late Task",
            dueDate: "2025-06-20",
          }),
          makeCard({
            id: "c2",
            number: 2,
            title: "Early Task",
            dueDate: "2025-06-05",
          }),
        ],
      }),
    ]);
    renderApp();
    const buttons = screen.getAllByRole("button", { name: /task/i });
    const titles = buttons.map((b) => b.textContent);
    const earlyIdx = titles.findIndex((t) => t?.includes("Early Task"));
    const lateIdx = titles.findIndex((t) => t?.includes("Late Task"));
    expect(earlyIdx).toBeLessThan(lateIdx);
  });

  it("opens card detail modal when tapping a card", async () => {
    seedBoard([
      makeColumn({
        id: "col-1",
        title: "Todo",
        cards: [
          makeCard({
            id: "c1",
            number: 1,
            title: "Tappable Task",
            dueDate: "2025-06-15",
          }),
        ],
      }),
    ]);
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();

    await user.click(screen.getByRole("button", { name: /Tappable Task/i }));
    expect(screen.getByTestId("card-detail-due-date")).toBeInTheDocument();
  });

  it("highlights matching cards with accent ring on search", async () => {
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

    await user.type(screen.getByPlaceholderText(/search/i), "Alpha");

    const alphaBtn = screen.getByRole("button", { name: /Alpha Task/i });
    const betaBtn = screen.getByRole("button", { name: /Beta Task/i });
    expect(alphaBtn.className).toContain("ring-2");
    expect(betaBtn.className).not.toContain("ring-2");
  });
});
