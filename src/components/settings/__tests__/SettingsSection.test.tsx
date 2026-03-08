import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect } from "vitest";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { BoardProvider } from "../../../board/BoardProvider";
import { SettingsSection } from "../SettingsSection";
import { kvGetBool } from "../../../utils/db";

function renderSection(title = "Test Section", defaultOpen = false) {
  return render(
    <BoardProvider>
      <ThemeProvider>
        <SettingsSection title={title} defaultOpen={defaultOpen}>
          <p>Section content</p>
        </SettingsSection>
      </ThemeProvider>
    </BoardProvider>,
  );
}

describe("SettingsSection", () => {
  it("starts collapsed by default", () => {
    renderSection();
    expect(screen.queryByText("Section content")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /test section/i }),
    ).toHaveAttribute("aria-expanded", "false");
  });

  it("starts open when defaultOpen is true", () => {
    renderSection("Open Section", true);
    expect(screen.getByText("Section content")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /open section/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("toggles open/closed on click", async () => {
    const user = userEvent.setup();
    renderSection();
    const btn = screen.getByRole("button", { name: /test section/i });

    await user.click(btn);
    expect(screen.getByText("Section content")).toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-expanded", "true");

    await user.click(btn);
    expect(screen.queryByText("Section content")).not.toBeInTheDocument();
    expect(btn).toHaveAttribute("aria-expanded", "false");
  });

  it("persists open state to IndexedDB", async () => {
    const user = userEvent.setup();
    renderSection("Persist Test");
    const btn = screen.getByRole("button", { name: /persist test/i });

    // Open the section
    await user.click(btn);
    expect(kvGetBool("kanbeasy:section:persist-test", false)).toBe(true);

    // Close the section
    await user.click(btn);
    expect(kvGetBool("kanbeasy:section:persist-test", true)).toBe(false);
  });

  it("restores persisted state on remount", async () => {
    const user = userEvent.setup();
    renderSection("Remount Test");

    // Open the section
    await user.click(screen.getByRole("button", { name: /remount test/i }));
    expect(kvGetBool("kanbeasy:section:remount-test", false)).toBe(true);

    // Unmount and remount
    cleanup();
    renderSection("Remount Test");

    // Should still be open
    expect(screen.getByText("Section content")).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /remount test/i }),
    ).toHaveAttribute("aria-expanded", "true");
  });
});
