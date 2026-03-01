import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { Tooltip } from "../Tooltip";

describe("Tooltip", () => {
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

  it("tooltip is hidden by default (opacity-0)", () => {
    render(
      <Tooltip content="Help text">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveClass(
      "opacity-0",
    );
  });

  it("positions tooltip below by default (side='bottom')", () => {
    render(
      <Tooltip content="Help text">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveClass(
      "top-full",
    );
  });

  it("positions tooltip above when side='top'", () => {
    render(
      <Tooltip content="Help text" side="top">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveClass(
      "bottom-full",
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

  it("tooltip has pointer-events-none", () => {
    render(
      <Tooltip content="Help text">
        <button type="button">Click me</button>
      </Tooltip>,
    );
    expect(screen.getByRole("tooltip", { hidden: true })).toHaveClass(
      "pointer-events-none",
    );
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
});
