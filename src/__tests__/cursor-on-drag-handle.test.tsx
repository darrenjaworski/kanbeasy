import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { ThemeProvider } from "../theme/ThemeProvider";
import { BoardProvider } from "../board/BoardProvider";
import { STORAGE_KEYS } from "../constants/storage";
import { describe, it, expect, beforeEach } from "vitest";

function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>
  );
}

// Note: we assert classList contains cursor utility classes; jsdom won't compute CSS, but
// this guards against regressions in class names.
describe("drag handle cursor styles", () => {
  beforeEach(() => {
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [] })
    );
  });

  it("applies grab/grabbing cursor classes on card drag handle", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add two columns
    await user.click(screen.getByRole("button", { name: /add column/i }));
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const columns = screen.getAllByRole("region", { name: /new column/i });
    const first = columns[0];

    // Add a card to first column
    const addCardBtn = within(first).getByRole("button", { name: /add card/i });
    await user.click(addCardBtn);

    // Find the card container (textarea parent) then get its drag handle
    const textareas = within(first).getAllByRole("textbox", {
      name: /card content/i,
    });
    const cardContainer = textareas[0].parentElement as HTMLElement;
    const dragBtn = within(cardContainer).getByRole("button", {
      name: /drag card/i,
    });

    expect(dragBtn.className).toMatch(/hover:cursor-grab/);
    expect(dragBtn.className).toMatch(/active:cursor-grabbing/);
  });

  it("applies grab/grabbing cursor classes on column drag handle", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add two columns so drag handles appear
    await user.click(screen.getByRole("button", { name: /add column/i }));
    await user.click(screen.getByRole("button", { name: /add column/i }));

    const columns = screen.getAllByRole("region", { name: /new column/i });
    const first = columns[0];

    const dragBtn = within(first).getByRole("button", { name: /drag column/i });

    expect(dragBtn.className).toMatch(/hover:cursor-grab/);
    expect(dragBtn.className).toMatch(/active:cursor-grabbing/);
  });
});
