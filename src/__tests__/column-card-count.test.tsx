import { screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { seedBoard } from "../utils/db";
import { renderApp } from "../test/renderApp";
import { describe, it, expect, beforeEach } from "vitest";

describe("column card count badge", () => {
  beforeEach(() => {
    seedBoard({ columns: [], archive: [] });
  });

  it("shows 0 for an empty column", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    expect(within(column as HTMLElement).getByText("0")).toBeInTheDocument();
  });

  it("shows correct count after adding cards", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });

    await user.click(addCardBtn);
    expect(within(column as HTMLElement).getByText("1")).toBeInTheDocument();

    await user.click(addCardBtn);
    expect(within(column as HTMLElement).getByText("2")).toBeInTheDocument();
  });

  it("decrements count when a card is archived", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });
    const addCardBtn = within(column as HTMLElement).getByRole("button", {
      name: /add card/i,
    });

    await user.click(addCardBtn);
    await user.click(addCardBtn);
    expect(within(column as HTMLElement).getByText("2")).toBeInTheDocument();

    const archiveBtn = within(column as HTMLElement).getAllByRole("button", {
      name: /archive card/i,
    })[0];
    await user.click(archiveBtn);

    expect(within(column as HTMLElement).getByText("1")).toBeInTheDocument();
  });

  it("has an accessible label with pluralized card count", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: /add column/i }));
    const column = screen.getByRole("region", { name: /new column/i });

    expect(
      within(column as HTMLElement).getByLabelText("0 cards"),
    ).toBeInTheDocument();

    await user.click(
      within(column as HTMLElement).getByRole("button", { name: /add card/i }),
    );

    expect(
      within(column as HTMLElement).getByLabelText("1 card"),
    ).toBeInTheDocument();
  });
});
