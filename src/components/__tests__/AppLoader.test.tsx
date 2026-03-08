import "@testing-library/jest-dom";
import { render, screen, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

vi.mock("../../utils/db", () => ({
  openDatabase: vi.fn(),
}));

import { openDatabase } from "../../utils/db";
import { AppLoader } from "../AppLoader";

const mockedOpenDatabase = vi.mocked(openDatabase);

describe("AppLoader", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("renders children after database opens", async () => {
    mockedOpenDatabase.mockResolvedValue(undefined);

    render(
      <AppLoader>
        <p>Board content</p>
      </AppLoader>,
    );

    // Flush the resolved promise
    await act(() => Promise.resolve());

    expect(screen.getByText("Board content")).toBeInTheDocument();
  });

  it("shows nothing initially while loading (before 100ms)", () => {
    // Keep the database pending indefinitely
    mockedOpenDatabase.mockReturnValue(new Promise(() => {}));

    const { container } = render(
      <AppLoader>
        <p>Board content</p>
      </AppLoader>,
    );

    expect(container.innerHTML).toBe("");
  });

  it("shows skeleton after delay if database is slow to open", () => {
    mockedOpenDatabase.mockReturnValue(new Promise(() => {}));

    render(
      <AppLoader>
        <p>Board content</p>
      </AppLoader>,
    );

    act(() => {
      vi.advanceTimersByTime(100);
    });

    // The skeleton should be visible (has animate-pulse class)
    const skeleton = document.querySelector(".animate-pulse");
    expect(skeleton).toBeInTheDocument();
    expect(screen.queryByText("Board content")).not.toBeInTheDocument();
  });
});
