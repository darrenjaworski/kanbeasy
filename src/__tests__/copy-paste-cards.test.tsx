import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { STORAGE_KEYS } from "../constants/storage";
import { renderApp } from "../test/renderApp";
import { describe, it, expect, beforeEach } from "vitest";

describe("copy and paste cards", () => {
  beforeEach(() => {
    localStorage.setItem(STORAGE_KEYS.BOARD, JSON.stringify({ columns: [] }));
  });

  it("shows paste button after copying a card", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add column and card
    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /add card/i,
      }),
    );

    // Only "Add card" button, no paste
    expect(
      within(column as HTMLElement).queryByRole("button", {
        name: /paste card/i,
      }),
    ).not.toBeInTheDocument();

    // Copy the card
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /copy card/i,
      }),
    );

    // Paste button appears
    expect(
      within(column as HTMLElement).getByRole("button", {
        name: /paste card/i,
      }),
    ).toBeInTheDocument();
  });

  it("pastes a card into the same column", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /add card/i,
      }),
    );

    // Copy then paste
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /copy card/i,
      }),
    );
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /paste card/i,
      }),
    );

    // Two cards now exist
    expect(
      within(column as HTMLElement).getAllByText(/new card/i),
    ).toHaveLength(2);
  });

  it("pastes a card into a different column", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add two columns
    await user.click(screen.getByRole("button", { name: /add column/i }));
    await user.click(screen.getByRole("button", { name: /add column/i }));
    const columns = screen.getAllByRole("region", { name: /new column/i });
    const column1 = columns[0] as HTMLElement;
    const column2 = columns[1] as HTMLElement;

    // Add card to first column
    await user.click(
      within(column1).getByRole("button", { name: /add card/i }),
    );

    // Copy from first column
    await user.click(
      within(column1).getByRole("button", { name: /copy card/i }),
    );

    // Paste into second column
    await user.click(
      within(column2).getByRole("button", { name: /paste card/i }),
    );

    // Card exists in both columns
    expect(within(column1).getAllByText(/new card/i)).toHaveLength(1);
    expect(within(column2).getAllByText(/new card/i)).toHaveLength(1);
  });

  it("can paste multiple times from one copy", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /add card/i,
      }),
    );

    // Copy once
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /copy card/i,
      }),
    );

    // Paste twice
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /paste card/i,
      }),
    );
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /paste card/i,
      }),
    );

    // Three cards (1 original + 2 pastes)
    expect(
      within(column as HTMLElement).getAllByText(/new card/i),
    ).toHaveLength(3);
  });

  it("changes add card button text when a card is copied", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /add card/i,
      }),
    );

    // Before copy: button says "Add card"
    expect(
      within(column as HTMLElement).getByText(/\+ add card/i),
    ).toBeInTheDocument();

    // Copy
    await user.click(
      within(column as HTMLElement).getByRole("button", {
        name: /copy card/i,
      }),
    );

    // After copy: button says "New"
    expect(
      within(column as HTMLElement).getByText(/\+ new/i),
    ).toBeInTheDocument();
  });
});
