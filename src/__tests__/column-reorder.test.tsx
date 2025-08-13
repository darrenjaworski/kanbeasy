import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { ThemeProvider } from "../theme/ThemeProvider";
import { BoardProvider } from "../board/BoardProvider";
import { describe, it, expect } from "vitest";

function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>
  );
}

describe("column drag handle", () => {
  it("renders a drag handle for each column next to the delete button", async () => {
    const user = userEvent.setup();
    renderApp();

    // Add two columns
    await user.click(screen.getByRole("button", { name: /add column/i }));
    await user.click(screen.getByRole("button", { name: /add column/i }));

    // Two columns exist
    expect(screen.getAllByRole("region", { name: /new column/i })).toHaveLength(
      2
    );
    // Two drag handle buttons exist and are labeled
    const handles = screen.getAllByRole("button", { name: /drag column/i });
    expect(handles).toHaveLength(2);
    // They are focusable and visible on focus
    handles[0].focus();
    expect(handles[0]).toHaveFocus();
    // The delete buttons are also present
    const deletes = screen.getAllByRole("button", { name: /remove column/i });
    expect(deletes).toHaveLength(2);
  });
});
