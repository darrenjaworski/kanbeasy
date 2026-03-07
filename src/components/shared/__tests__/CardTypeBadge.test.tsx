import "@testing-library/jest-dom";
import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { CardTypeBadge } from "../CardTypeBadge";

describe("CardTypeBadge", () => {
  it("renders colored badge when cardTypeColor is provided", () => {
    render(
      <CardTypeBadge number={42} cardTypeId="feat" cardTypeColor="#22c55e" />,
    );
    const badge = screen.getByText("feat-42");
    expect(badge).toHaveStyle({ color: "#22c55e" });
  });

  it("renders plain label when no color snapshot exists", () => {
    render(<CardTypeBadge number={7} cardTypeId={null} />);
    expect(screen.getByText("#7")).toBeInTheDocument();
  });

  it("uses cardTypeId in label even without a live type definition", () => {
    // Simulates a deleted type — card retains its snapshot
    render(
      <CardTypeBadge
        number={3}
        cardTypeId="deleted-type"
        cardTypeColor="#ff0000"
      />,
    );
    expect(screen.getByText("deleted-type-3")).toBeInTheDocument();
  });

  it("renders plain fallback when cardTypeId is set but no color snapshot", () => {
    // Legacy card with type ID but no snapshot color — shows ID-based label without color
    render(<CardTypeBadge number={5} cardTypeId="feat" />);
    expect(screen.getByText("feat-5")).toBeInTheDocument();
  });
});
