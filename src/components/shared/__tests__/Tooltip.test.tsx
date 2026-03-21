import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { Tooltip } from "../Tooltip";

let mockIsMobile = false;

vi.mock("../../../hooks", () => ({
  useIsMobile: () => mockIsMobile,
}));

describe("Tooltip", () => {
  beforeEach(() => {
    mockIsMobile = false;
  });

  it("renders children", () => {
    render(
      <Tooltip content="Help text">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });

  it("renders tooltip text with role='tooltip'", () => {
    render(
      <Tooltip content="Help text">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveTextContent(
      "Help text",
    );
  });

  it("positions tooltip below by default (side='bottom')", () => {
    render(
      <Tooltip content="Help text">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveAttribute(
      "data-side",
      "bottom",
    );
  });

  it("positions tooltip above when side='top'", () => {
    render(
      <Tooltip content="Help text" side="top">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveAttribute(
      "data-side",
      "top",
    );
  });

  it("does not block button click events", async () => {
    const user = userEvent.setup();
    const onClick = vi.fn();
    render(
      <Tooltip content="Help text">
        <button type="button" onClick={onClick}>
          Click me
        </button>
      </Tooltip>,
    );
    await user.click(screen.getByRole("button", { name: "Click me" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("tooltip has aria-hidden", () => {
    render(
      <Tooltip content="Help text">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveAttribute(
      "aria-hidden",
      "true",
    );
  });

  // --- Mobile ---

  it("does not render tooltip content on mobile", () => {
    mockIsMobile = true;
    render(
      <Tooltip content="Help text">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(
      screen.queryByRole("tooltip", { hidden: true }),
    ).not.toBeInTheDocument();
  });

  it("still renders children on mobile", () => {
    mockIsMobile = true;
    render(
      <Tooltip content="Help text">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(
      screen.getByRole("button", { name: "Click me" }),
    ).toBeInTheDocument();
  });
});
