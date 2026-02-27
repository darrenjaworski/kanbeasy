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
  const props = {
    open: true,
    onClose: vi.fn(),
    card: baseCard,
    columnId: "col-1",
    columns: baseColumns,
    density: "medium" as const,
    onUpdate: vi.fn(),
    onMoveCard: vi.fn(),
    ...overrides,
  };
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

  it("does not render when open is false", () => {
    renderModal({ open: false });
    expect(screen.queryByTestId("card-detail-title")).not.toBeInTheDocument();
  });
});
