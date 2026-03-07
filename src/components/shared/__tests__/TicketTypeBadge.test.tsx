import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { TicketTypeBadge } from "../TicketTypeBadge";

describe("TicketTypeBadge", () => {
  it("renders colored badge when ticketTypeColor is provided", () => {
    render(
      <TicketTypeBadge
        number={42}
        ticketTypeId="feat"
        ticketTypeColor="#22c55e"
      />,
    );
    const badge = screen.getByText("feat-42");
    expect(badge).toHaveStyle({ color: "#22c55e" });
  });

  it("renders plain label when no color snapshot exists", () => {
    render(<TicketTypeBadge number={7} ticketTypeId={null} />);
    expect(screen.getByText("#7")).toBeInTheDocument();
  });

  it("uses ticketTypeId in label even without a live type definition", () => {
    // Simulates a deleted type — card retains its snapshot
    render(
      <TicketTypeBadge
        number={3}
        ticketTypeId="deleted-type"
        ticketTypeColor="#ff0000"
      />,
    );
    expect(screen.getByText("deleted-type-3")).toBeInTheDocument();
  });

  it("renders plain fallback when ticketTypeId is set but no color snapshot", () => {
    // Legacy card with type ID but no snapshot color — shows ID-based label without color
    render(<TicketTypeBadge number={5} ticketTypeId="feat" />);
    expect(screen.getByText("feat-5")).toBeInTheDocument();
  });
});
