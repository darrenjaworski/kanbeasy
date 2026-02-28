import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderApp } from "../test/renderApp";
import { describe, it, expect } from "vitest";

describe("card delete", () => {
  it("archives a card from a column using the card's archive button", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add column
    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    // Add two cards
    const addBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });
    await user.click(addBtn);
    await user.click(addBtn);

    // Two cards exist
    expect(
      within(column as HTMLElement).getAllByText(/new card/i),
    ).toHaveLength(2);

    // Click the archive button on the first card in the column
    const firstCard = within(column as HTMLElement)
      .getAllByText(/new card/i)[0]
      .closest("div");
    const archiveBtn = within(firstCard as HTMLElement).getByRole("button", {
      name: /archive card/i,
    });
    await user.click(archiveBtn);

    // Only one card remains
    expect(
      within(column as HTMLElement).getAllByText(/new card/i),
    ).toHaveLength(1);
  });
});
