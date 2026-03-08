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

  it("toggles field visibility", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /appearance/i }));
    await user.click(
      screen.getByRole("button", { name: /card layout editor/i }),
    );

    // Description is hidden by default
    const descCheckbox = screen.getByRole("checkbox", {
      name: /show description/i,
    });
    expect(descCheckbox).not.toBeChecked();

    // Toggle it on
    await user.click(descCheckbox);
    expect(descCheckbox).toBeChecked();

    // Toggle it off
    await user.click(descCheckbox);
    expect(descCheckbox).not.toBeChecked();
  });

  it("enforces max 5 visible fields", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /appearance/i }));
    await user.click(
      screen.getByRole("button", { name: /card layout editor/i }),
    );

    // Default has 4 visible (badge, title, checklist, dueDate)
    // Enable description (5th)
    await user.click(
      screen.getByRole("checkbox", { name: /show description/i }),
    );

    // Now at max — remaining unchecked fields should be disabled
    const createdCheckbox = screen.getByRole("checkbox", {
      name: /show created date/i,
    });
    const updatedCheckbox = screen.getByRole("checkbox", {
      name: /show updated date/i,
    });
    expect(createdCheckbox).toBeDisabled();
    expect(updatedCheckbox).toBeDisabled();

    // Already-visible fields should still be toggleable
    const descCheckbox = screen.getByRole("checkbox", {
      name: /show description/i,
    });
    expect(descCheckbox).not.toBeDisabled();
  });

  it("shows visible count indicator", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /appearance/i }));
    await user.click(
      screen.getByRole("button", { name: /card layout editor/i }),
    );

    expect(screen.getByText("4/5 visible")).toBeInTheDocument();
  });

  it("changes line count for title field", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /appearance/i }));
    await user.click(
      screen.getByRole("button", { name: /card layout editor/i }),
    );

    const titleSelect = screen.getByRole("combobox", {
      name: /title line count/i,
    });
    expect(titleSelect).toHaveValue("1");

    await user.selectOptions(titleSelect, "3");
    expect(titleSelect).toHaveValue("3");
  });

  it("resets layout to default", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /appearance/i }));
    await user.click(
      screen.getByRole("button", { name: /card layout editor/i }),
    );

    // Enable description
    await user.click(
      screen.getByRole("checkbox", { name: /show description/i }),
    );
    expect(
      screen.getByRole("checkbox", { name: /show description/i }),
    ).toBeChecked();

    // Reset
    await user.click(screen.getByTestId("layout-reset"));

    // Description should be hidden again
    expect(
      screen.getByRole("checkbox", { name: /show description/i }),
    ).not.toBeChecked();
  });

  it("shows drag handles for reordering", async () => {
    const user = userEvent.setup();
    renderModal();

    await user.click(screen.getByRole("button", { name: /appearance/i }));
    await user.click(
      screen.getByRole("button", { name: /card layout editor/i }),
    );

    // Each field should have a reorder button
    expect(
      screen.getByRole("button", { name: /reorder card number/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reorder title/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /reorder due date/i }),
    ).toBeInTheDocument();
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
