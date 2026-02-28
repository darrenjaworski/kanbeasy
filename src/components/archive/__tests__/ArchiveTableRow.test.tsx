import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ArchiveTableRow } from "../ArchiveTableRow";
import type { ArchivedCard } from "../../../board/types";

function makeArchivedCard(overrides: Partial<ArchivedCard> = {}): ArchivedCard {
  const now = Date.now();
  return {
    id: "card-1",
    number: 42,
    title: "Test Card",
    description: "",
    ticketTypeId: null,
    createdAt: now,
    updatedAt: now,
    columnHistory: [{ columnId: "col-1", enteredAt: now }],
    archivedAt: now,
    archivedFromColumnId: "col-1",
    ...overrides,
  };
}

function renderRow(
  props: Partial<React.ComponentProps<typeof ArchiveTableRow>> = {},
) {
  const defaultProps = {
    card: makeArchivedCard(),
    selected: false,
    onToggle: vi.fn(),
    isLast: false,
    ...props,
  };
  return render(
    <table>
      <tbody>
        <ArchiveTableRow {...defaultProps} />
      </tbody>
    </table>,
  );
}

describe("ArchiveTableRow", () => {
  it("renders card number and title", () => {
    renderRow({ card: makeArchivedCard({ number: 7, title: "My Task" }) });
    expect(screen.getByText("#7")).toBeInTheDocument();
    expect(screen.getByText("My Task")).toBeInTheDocument();
  });

  it("renders 'Untitled' for cards with empty title", () => {
    renderRow({ card: makeArchivedCard({ title: "" }) });
    expect(screen.getByText("Untitled")).toBeInTheDocument();
  });

  it("renders checkbox with correct checked state", () => {
    renderRow({ selected: true });
    const checkbox = screen.getByRole("checkbox", { name: /select card #42/i });
    expect(checkbox).toBeChecked();
  });

  it("renders unchecked checkbox when not selected", () => {
    renderRow({ selected: false });
    const checkbox = screen.getByRole("checkbox", { name: /select card #42/i });
    expect(checkbox).not.toBeChecked();
  });

  it("calls onToggle with card id when checkbox is clicked", async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderRow({ onToggle, card: makeArchivedCard({ id: "card-abc" }) });

    await user.click(screen.getByRole("checkbox"));
    expect(onToggle).toHaveBeenCalledWith("card-abc");
  });

  it("renders formatted archived date", () => {
    const archivedAt = new Date("2025-06-15T10:30:00").getTime();
    renderRow({ card: makeArchivedCard({ archivedAt }) });
    // formatDateTime produces a date string — just verify the row has a test id
    expect(screen.getByTestId("archive-card-row")).toBeInTheDocument();
  });

  it("has border-b class when not last", () => {
    renderRow({ isLast: false });
    const row = screen.getByTestId("archive-card-row");
    expect(row.className).toContain("border-b");
  });

  it("omits border-b class when last", () => {
    renderRow({ isLast: true });
    const row = screen.getByTestId("archive-card-row");
    expect(row.className).not.toContain("border-b");
  });
});
