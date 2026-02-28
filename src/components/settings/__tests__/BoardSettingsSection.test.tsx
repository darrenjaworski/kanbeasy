import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { renderApp } from "../../../test/renderApp";

async function openSettings(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: /open settings/i }));
  return screen.findByRole("dialog", { name: /settings/i });
}

describe("BoardSettingsSection", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("renders column resizing toggle", async () => {
    const user = userEvent.setup();
    renderApp();
    await openSettings(user);

    // Expand Preferences section
    await user.click(screen.getByText("Preferences"));

    expect(screen.getByText("Column resizing")).toBeInTheDocument();
    const toggle = screen.getByRole("switch", { name: /column resizing/i });
    expect(toggle).not.toBeChecked();
  });

  it("renders delete column warning toggle", async () => {
    const user = userEvent.setup();
    renderApp();
    await openSettings(user);

    await user.click(screen.getByText("Preferences"));

    expect(
      screen.getByText("Warn before removing columns with cards"),
    ).toBeInTheDocument();
  });

  it("renders owl assistant toggle with description", async () => {
    const user = userEvent.setup();
    renderApp();
    await openSettings(user);

    await user.click(screen.getByText("Preferences"));

    expect(screen.getByText("Owl assistant")).toBeInTheDocument();
    expect(
      screen.getByText(
        "A friendly owl that shares productivity tips and jokes",
      ),
    ).toBeInTheDocument();
  });

  it("toggles column resizing on and off", async () => {
    const user = userEvent.setup();
    renderApp();
    await openSettings(user);

    await user.click(screen.getByText("Preferences"));

    const toggle = screen.getByRole("switch", { name: /column resizing/i });
    expect(toggle).not.toBeChecked();

    await user.click(toggle);
    expect(toggle).toBeChecked();

    await user.click(toggle);
    expect(toggle).not.toBeChecked();
  });
});
