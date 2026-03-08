import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ThemeProvider } from "../../../theme/ThemeProvider";
import { BoardProvider } from "../../../board/BoardProvider";
import { SettingsModal } from "../SettingsModal";

function renderModal() {
  return render(
    <BoardProvider>
      <ThemeProvider>
        <SettingsModal open={true} onClose={vi.fn()} />
      </ThemeProvider>
    </BoardProvider>,
  );
}

describe("CardLayoutSection", () => {
  it("shows Card Layout button in Appearance section when feature flag is enabled", async () => {
    const user = userEvent.setup();
    renderModal();

    // Expand Appearance section
    await user.click(screen.getByRole("button", { name: /appearance/i }));

    // Card Layout button should be visible (feature flag is on in test/dev)
    expect(
      screen.getByRole("button", { name: /card layout editor/i }),
    ).toBeInTheDocument();
  });

  it("navigates to card layout editor and back", async () => {
    const user = userEvent.setup();
    renderModal();

    // Expand Appearance and click Card Layout
    await user.click(screen.getByRole("button", { name: /appearance/i }));
    await user.click(
      screen.getByRole("button", { name: /card layout editor/i }),
    );

    // Modal title should change to Card Layout Editor
    expect(
      screen.getByRole("heading", { name: /card layout editor/i }),
    ).toBeInTheDocument();

    // Should show the card layout editor
    expect(screen.getByTestId("card-layout-editor")).toBeInTheDocument();
    expect(screen.getByTestId("card-layout-preview")).toBeInTheDocument();

    // Should show back button
    const backBtn = screen.getByRole("button", {
      name: /back to settings/i,
    });
    expect(backBtn).toBeInTheDocument();

    // Settings sections should not be visible
    expect(
      screen.queryByRole("button", { name: /appearance/i }),
    ).not.toBeInTheDocument();

    // Click back
    await user.click(backBtn);

    // Should be back on settings view with original title
    expect(
      screen.getByRole("heading", { name: /settings/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /appearance/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("card-layout-editor")).not.toBeInTheDocument();
  });

  it("shows all default fields in the editor", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /appearance/i }));
    await user.click(
      screen.getByRole("button", { name: /card layout editor/i }),
    );

    // All 7 fields should be listed
    expect(screen.getByTestId("layout-field-badge")).toBeInTheDocument();
    expect(screen.getByTestId("layout-field-title")).toBeInTheDocument();
    expect(screen.getByTestId("layout-field-description")).toBeInTheDocument();
    expect(screen.getByTestId("layout-field-checklist")).toBeInTheDocument();
    expect(screen.getByTestId("layout-field-dueDate")).toBeInTheDocument();
    expect(screen.getByTestId("layout-field-createdAt")).toBeInTheDocument();
    expect(screen.getByTestId("layout-field-updatedAt")).toBeInTheDocument();
  });

  it("preview shows only visible fields", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /appearance/i }));
    await user.click(
      screen.getByRole("button", { name: /card layout editor/i }),
    );

    const preview = screen.getByTestId("card-layout-preview");

    // Default visible: badge, title, checklist, dueDate
    // Badge uses actual CardTypeBadge component
    expect(preview).toHaveTextContent("feat-42");
    // Title uses actual textarea
    expect(preview).toHaveTextContent("My example task");

    // Default hidden: description, createdAt, updatedAt
    expect(preview).not.toHaveTextContent("Created");
    expect(preview).not.toHaveTextContent("Updated");
  });

  it("resets view to settings when modal is closed and reopened", async () => {
    const user = userEvent.setup();
    const onClose = vi.fn();
    const { rerender } = render(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={onClose} />
        </ThemeProvider>
      </BoardProvider>,
    );

    // Navigate to card layout
    await user.click(screen.getByRole("button", { name: /appearance/i }));
    await user.click(
      screen.getByRole("button", { name: /card layout editor/i }),
    );
    expect(screen.getByTestId("card-layout-editor")).toBeInTheDocument();

    // Close modal via Escape (triggers onClose)
    await user.keyboard("{Escape}");
    expect(onClose).toHaveBeenCalled();

    // Rerender as closed then reopen
    rerender(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={false} onClose={onClose} />
        </ThemeProvider>
      </BoardProvider>,
    );
    rerender(
      <BoardProvider>
        <ThemeProvider>
          <SettingsModal open={true} onClose={onClose} />
        </ThemeProvider>
      </BoardProvider>,
    );

    // Should be back on settings view, not card layout
    expect(
      screen.getByRole("button", { name: /appearance/i }),
    ).toBeInTheDocument();
    expect(screen.queryByTestId("card-layout-editor")).not.toBeInTheDocument();
  });
});
