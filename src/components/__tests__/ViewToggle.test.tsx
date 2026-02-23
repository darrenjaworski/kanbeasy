import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { ViewToggle } from "../ViewToggle";
import { ThemeProvider } from "../../theme/ThemeProvider";
import { STORAGE_KEYS } from "../../constants/storage";

function renderToggle() {
  return render(
    <ThemeProvider>
      <ViewToggle />
    </ThemeProvider>,
  );
}

describe("ViewToggle", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders board and list radio buttons", () => {
    renderToggle();
    expect(
      screen.getByRole("radio", { name: /board view/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("radio", { name: /list view/i }),
    ).toBeInTheDocument();
  });

  it("defaults to board view checked", () => {
    renderToggle();
    expect(screen.getByRole("radio", { name: /board view/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: /list view/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("toggles to list view on click", async () => {
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole("radio", { name: /list view/i }));
    expect(screen.getByRole("radio", { name: /list view/i })).toHaveAttribute(
      "aria-checked",
      "true",
    );
    expect(screen.getByRole("radio", { name: /board view/i })).toHaveAttribute(
      "aria-checked",
      "false",
    );
  });

  it("persists preference to localStorage", async () => {
    const user = userEvent.setup();
    renderToggle();
    await user.click(screen.getByRole("radio", { name: /list view/i }));
    expect(localStorage.getItem(STORAGE_KEYS.VIEW_MODE)).toBe("list");
  });
});
