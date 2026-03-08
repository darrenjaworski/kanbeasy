import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { seedBoard } from "../utils/db";
import { renderApp } from "../test/renderApp";
import { describe, it, expect, beforeEach } from "vitest";

describe("column add card", () => {
  beforeEach(() => {
    seedBoard({ columns: [], archive: [] });
  });

  it("adds a card to a column using the column's Add card button", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add first column
    await user.click(screen.getByRole("button", { name: /add column/i }));

    // Find the column by its heading
    const column = screen.getByRole("region", { name: /new column/i });

    // Click the add card button
    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addCardBtn);

    // Card appears with default title
    expect(
      within(column as HTMLElement).getByText(/new card/i),
    ).toBeInTheDocument();
  });

  it("does not retain focus on add card button after clicking it", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addCardBtn);

    expect(document.activeElement).not.toBe(addCardBtn);
  });

  it("auto-focuses and selects the new card title after adding a card", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addCardBtn);

    // Focus should be on the new card's textarea
    const cardTextarea = within(column as HTMLElement).getByRole("textbox", {
      name: /card content/i,
    });
    expect(document.activeElement).toBe(cardTextarea);

    // The default title text should be selected so the user can type to replace
    expect((cardTextarea as HTMLTextAreaElement).selectionStart).toBe(0);
    expect((cardTextarea as HTMLTextAreaElement).selectionEnd).toBe(
      "New card".length,
    );
  });
});
