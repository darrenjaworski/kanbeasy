import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi } from "vitest";
import { ToggleSwitch } from "../ToggleSwitch";

describe("ToggleSwitch", () => {
  it("renders label text", () => {
    render(
      <ToggleSwitch
        id="test"
        label="Enable feature"
        checked={false}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("Enable feature")).toBeInTheDocument();
  });

  it("renders description when provided", () => {
    render(
      <ToggleSwitch
        id="test"
        label="Feature"
        description="A helpful description"
        checked={false}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByText("A helpful description")).toBeInTheDocument();
  });

  it("does not render description when omitted", () => {
    render(
      <ToggleSwitch
        id="test"
        label="Feature"
        checked={false}
        onChange={vi.fn()}
      />,
    );
    expect(
      screen.queryByText(
        (_, el) =>
          (el?.tagName === "SPAN" && el.classList.contains("text-xs")) || false,
      ),
    ).not.toBeInTheDocument();
  });

  it("renders as checked when checked prop is true", () => {
    render(
      <ToggleSwitch
        id="test"
        label="Feature"
        checked={true}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("switch")).toBeChecked();
  });

  it("renders as unchecked when checked prop is false", () => {
    render(
      <ToggleSwitch
        id="test"
        label="Feature"
        checked={false}
        onChange={vi.fn()}
      />,
    );
    expect(screen.getByRole("switch")).not.toBeChecked();
  });

  it("calls onChange with true when toggling on", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleSwitch
        id="test"
        label="Feature"
        checked={false}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(true);
  });

  it("calls onChange with false when toggling off", async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    render(
      <ToggleSwitch
        id="test"
        label="Feature"
        checked={true}
        onChange={onChange}
      />,
    );
    await user.click(screen.getByRole("switch"));
    expect(onChange).toHaveBeenCalledWith(false);
  });
});
