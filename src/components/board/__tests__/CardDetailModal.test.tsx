import "@testing-library/jest-dom";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { vi, describe, it, expect } from "vitest";
import { CardDetailModal } from "../CardDetailModal";
import type { Card, Column } from "../../../board/types";

const baseCard: Card = {
  id: "card-1",
  number: 1,
  title: "Test Card",
  description: "Test description",
  ticketTypeId: null,
  dueDate: null,
  createdAt: new Date("2025-06-15T12:00:00Z").getTime(),
  updatedAt: new Date("2025-06-16T12:00:00Z").getTime(),
  columnHistory: [
    {
      columnId: "col-1",
      enteredAt: new Date("2025-06-15T12:00:00Z").getTime(),
    },
  ],
};

const emptyDescCard: Card = {
  ...baseCard,
  id: "card-2",
  description: "",
};

const baseColumns: Column[] = [
  {
    id: "col-1",
    title: "To Do",
    cards: [baseCard],
    createdAt: 0,
    updatedAt: 0,
  },
  { id: "col-2", title: "Done", cards: [], createdAt: 0, updatedAt: 0 },
];

function renderModal(
  overrides: Partial<Parameters<typeof CardDetailModal>[0]> = {},
) {
  const defaults = {
    open: true,
    onClose: vi.fn(),
    card: baseCard,
    columnId: "col-1",
    columns: baseColumns,
    density: "medium" as const,
    onUpdate: vi.fn(),
    onMoveCard: vi.fn(),
    onArchive: vi.fn(),
    ticketTypes: [] as Parameters<typeof CardDetailModal>[0]["ticketTypes"],
  };
  const props = { ...defaults, ...overrides };
  const result = render(<CardDetailModal {...props} />);
  return { ...result, ...props };
}

/** Click the markdown preview to enter edit mode, returns the textarea */
async function enterDescriptionEditMode(
  user: ReturnType<typeof userEvent.setup>,
) {
  const preview = screen.getByTestId("card-detail-description-preview");
  await user.click(preview);
  return screen.getByTestId("card-detail-description");
}

describe("CardDetailModal", () => {
  it("renders title and description preview", () => {
    renderModal();
    expect(screen.getByTestId("card-detail-title")).toHaveValue("Test Card");
    // Description shows as rendered markdown preview, not a textarea
    expect(
      screen.getByTestId("card-detail-description-preview"),
    ).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("displays column selector and metadata timestamps", () => {
    renderModal();
    const select = screen.getByTestId("card-detail-column");
    expect(select).toHaveValue("col-1");
    const metadata = screen.getByTestId("card-detail-metadata");
    expect(metadata).toHaveTextContent("Created:");
    expect(metadata).toHaveTextContent("Updated:");
  });

  it("calls onMoveCard when column is changed", async () => {
    const user = userEvent.setup();
    const { onMoveCard } = renderModal();

    const select = screen.getByTestId("card-detail-column");
    await user.selectOptions(select, "col-2");

    expect(onMoveCard).toHaveBeenCalledWith("col-2");
  });

  it("saves title on blur", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderModal();

    const titleInput = screen.getByTestId("card-detail-title");
    await user.clear(titleInput);
    await user.type(titleInput, "New Title");
    fireEvent.blur(titleInput);

    expect(onUpdate).toHaveBeenCalledWith({ title: "New Title" });
  });

  it("shows placeholder when description is empty", () => {
    renderModal({ card: emptyDescCard });
    const placeholder = screen.getByTestId(
      "card-detail-description-placeholder",
    );
    expect(placeholder).toHaveTextContent("Add a description...");
  });

  it("clicking placeholder enters edit mode", async () => {
    const user = userEvent.setup();
    renderModal({ card: emptyDescCard });

    const placeholder = screen.getByTestId(
      "card-detail-description-placeholder",
    );
    await user.click(placeholder);

    expect(screen.getByTestId("card-detail-description")).toBeInTheDocument();
  });

  it("renders markdown preview when description exists", () => {
    renderModal({
      card: { ...baseCard, description: "**bold text**" },
    });
    const preview = screen.getByTestId("card-detail-description-preview");
    expect(preview).toBeInTheDocument();
    // Check that bold text is rendered
    const strong = preview.querySelector("strong");
    expect(strong).toHaveTextContent("bold text");
  });

  it("clicking preview enters edit mode with textarea", async () => {
    const user = userEvent.setup();
    renderModal();

    const descInput = await enterDescriptionEditMode(user);
    expect(descInput).toBeInTheDocument();
    expect(descInput.tagName).toBe("TEXTAREA");
    expect(descInput).toHaveValue("Test description");
  });

  it("saves description on blur and returns to preview", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderModal();

    const descInput = await enterDescriptionEditMode(user);
    await user.clear(descInput);
    await user.type(descInput, "New description");
    fireEvent.blur(descInput);

    expect(onUpdate).toHaveBeenCalledWith({ description: "New description" });
    // Should return to preview mode
    expect(
      screen.queryByTestId("card-detail-description"),
    ).not.toBeInTheDocument();
  });

  it("allows clearing description", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderModal();

    const descInput = await enterDescriptionEditMode(user);
    await user.clear(descInput);
    fireEvent.blur(descInput);

    expect(onUpdate).toHaveBeenCalledWith({ description: "" });
  });

  it("does not call onUpdate when description is unchanged", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderModal();

    const descInput = await enterDescriptionEditMode(user);
    fireEvent.blur(descInput);

    expect(onUpdate).not.toHaveBeenCalled();
  });

  it("reverts description on Escape and returns to preview", async () => {
    const user = userEvent.setup();
    const { onUpdate } = renderModal();

    const descInput = await enterDescriptionEditMode(user);
    await user.clear(descInput);
    await user.type(descInput, "Changed");
    await user.keyboard("{Escape}");

    expect(onUpdate).not.toHaveBeenCalled();
    // Should return to preview mode with original text
    expect(
      screen.getByTestId("card-detail-description-preview"),
    ).toBeInTheDocument();
    expect(screen.getByText("Test description")).toBeInTheDocument();
  });

  it("calls onClose when close button is clicked", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    const closeBtn = screen.getByRole("button", {
      name: /close #1 card details/i,
    });
    await user.click(closeBtn);

    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on Escape key", () => {
    const { onClose } = renderModal();

    fireEvent.keyDown(window, { key: "Escape" });

    expect(onClose).toHaveBeenCalled();
  });

  it("calls onClose on backdrop click", async () => {
    const user = userEvent.setup();
    const { onClose } = renderModal();

    const backdrop = screen.getByTestId("modal-backdrop");
    await user.click(backdrop);

    expect(onClose).toHaveBeenCalled();
  });

  describe("checklist features", () => {
    const checklistCard: Card = {
      ...baseCard,
      id: "card-checklist",
      description: "- [ ] First item\n- [x] Second item\n- [ ] Third item",
    };

    it("shows add checklist item button on empty description", () => {
      renderModal({ card: emptyDescCard });
      expect(
        screen.getByTestId("checklist-add-item-button"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("checklist-add-item-button")).toHaveTextContent(
        "+ Add checklist item",
      );
    });

    it("shows add checklist item button below preview", () => {
      renderModal({ card: checklistCard });
      expect(
        screen.getByTestId("checklist-add-item-button"),
      ).toBeInTheDocument();
    });

    it("clicking add button reveals input", async () => {
      const user = userEvent.setup();
      renderModal({ card: emptyDescCard });

      await user.click(screen.getByTestId("checklist-add-item-button"));
      expect(
        screen.getByTestId("checklist-add-item-input"),
      ).toBeInTheDocument();
      expect(screen.getByTestId("checklist-add-item-input")).toHaveFocus();
    });

    it("adding item via Enter appends to description and saves", async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderModal({ card: emptyDescCard });

      await user.click(screen.getByTestId("checklist-add-item-button"));
      const input = screen.getByTestId("checklist-add-item-input");
      await user.type(input, "New task");
      await user.keyboard("{Enter}");

      expect(onUpdate).toHaveBeenCalledWith({
        description: "- [ ] New task",
      });
    });

    it("adding item to existing description appends on new line", async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderModal({ card: checklistCard });

      await user.click(screen.getByTestId("checklist-add-item-button"));
      const input = screen.getByTestId("checklist-add-item-input");
      await user.type(input, "Fourth item");
      await user.keyboard("{Enter}");

      expect(onUpdate).toHaveBeenCalledWith({
        description:
          "- [ ] First item\n- [x] Second item\n- [ ] Third item\n- [ ] Fourth item",
      });
    });

    it("input clears after adding item and stays visible", async () => {
      const user = userEvent.setup();
      renderModal({ card: emptyDescCard });

      await user.click(screen.getByTestId("checklist-add-item-button"));
      const input = screen.getByTestId("checklist-add-item-input");
      await user.type(input, "Task one");
      await user.keyboard("{Enter}");

      expect(input).toHaveValue("");
      expect(input).toBeInTheDocument();
    });

    it("Escape dismisses add item input", async () => {
      const user = userEvent.setup();
      renderModal({ card: emptyDescCard });

      await user.click(screen.getByTestId("checklist-add-item-button"));
      expect(
        screen.getByTestId("checklist-add-item-input"),
      ).toBeInTheDocument();

      await user.keyboard("{Escape}");
      expect(
        screen.queryByTestId("checklist-add-item-input"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("checklist-add-item-button"),
      ).toBeInTheDocument();
    });

    it("empty input does not add item on Enter", async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderModal({ card: emptyDescCard });

      await user.click(screen.getByTestId("checklist-add-item-button"));
      await user.keyboard("{Enter}");

      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("whitespace-only input does not add item on Enter", async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderModal({ card: emptyDescCard });

      await user.click(screen.getByTestId("checklist-add-item-button"));
      const input = screen.getByTestId("checklist-add-item-input");
      await user.type(input, "   ");
      await user.keyboard("{Enter}");

      expect(onUpdate).not.toHaveBeenCalled();
    });

    it("renders interactive checkboxes in preview", () => {
      renderModal({ card: checklistCard });
      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      expect(checkboxes).toHaveLength(3);
      expect(checkboxes[0]).not.toBeChecked();
      expect(checkboxes[0]).not.toBeDisabled();
      expect(checkboxes[1]).toBeChecked();
      expect(checkboxes[1]).not.toBeDisabled();
      expect(checkboxes[2]).not.toBeChecked();
    });

    it("clicking checkbox toggles it and saves", async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderModal({ card: checklistCard });

      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[0]);

      expect(onUpdate).toHaveBeenCalledWith({
        description: "- [x] First item\n- [x] Second item\n- [ ] Third item",
      });
    });

    it("clicking checkbox does not enter edit mode", async () => {
      const user = userEvent.setup();
      renderModal({ card: checklistCard });

      const checkboxes = document.querySelectorAll('input[type="checkbox"]');
      await user.click(checkboxes[0]);

      // Should still be in preview mode, not edit mode
      expect(
        screen.queryByTestId("card-detail-description"),
      ).not.toBeInTheDocument();
      expect(
        screen.getByTestId("card-detail-description-preview"),
      ).toBeInTheDocument();
    });
  });

  describe("due date field", () => {
    it("renders due date input with empty value when no due date set", () => {
      renderModal();
      const input = screen.getByTestId("card-detail-due-date");
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue("");
    });

    it("renders due date input with value when due date is set", () => {
      renderModal({ card: { ...baseCard, dueDate: "2025-12-31" } });
      const input = screen.getByTestId("card-detail-due-date");
      expect(input).toHaveValue("2025-12-31");
    });

    it("calls onUpdate when due date is changed", async () => {
      const user = userEvent.setup();
      const { onUpdate } = renderModal();

      const input = screen.getByTestId("card-detail-due-date");
      await user.clear(input);
      fireEvent.change(input, { target: { value: "2025-07-15" } });

      expect(onUpdate).toHaveBeenCalledWith({ dueDate: "2025-07-15" });
    });

    it("calls onUpdate with null when due date is cleared", () => {
      const { onUpdate } = renderModal({
        card: { ...baseCard, dueDate: "2025-12-31" },
      });

      const input = screen.getByTestId("card-detail-due-date");
      fireEvent.change(input, { target: { value: "" } });

      expect(onUpdate).toHaveBeenCalledWith({ dueDate: null });
    });
  });

  it("does not render when open is false", () => {
    renderModal({ open: false });
    expect(screen.queryByTestId("card-detail-title")).not.toBeInTheDocument();
  });
});
