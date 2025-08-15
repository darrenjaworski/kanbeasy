import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { AddColumn } from "../components/AddColumn";

describe("AddColumn alignment", () => {
  it("should have proper centering classes applied", () => {
    const handleOnClick = () => {};
    render(<AddColumn handleOnClick={handleOnClick} />);
    
    const button = screen.getByTestId("add-column-button");
    const innerDiv = button.querySelector("div");
    
    // Check button classes for flexbox layout
    expect(button).toHaveClass("flex");
    expect(button).toHaveClass("flex-col");
    // Button should NOT have text-center (applying it to inner div instead)
    expect(button).not.toHaveClass("text-center");
    
    // Check inner div classes for centering (flexbox + text-center for reliable iPad support)
    expect(innerDiv).toHaveClass("flex");
    expect(innerDiv).toHaveClass("items-center");
    expect(innerDiv).toHaveClass("justify-center");
    expect(innerDiv).toHaveClass("text-center");
  });

  it("should center content properly using flexbox and text alignment", () => {
    const handleOnClick = () => {};
    render(<AddColumn handleOnClick={handleOnClick} />);
    
    const button = screen.getByTestId("add-column-button");
    const innerDiv = button.querySelector("div");
    
    // Verify the button text content is present
    expect(button).toHaveTextContent("Add Column");
    
    // Verify hybrid centering approach: flexbox + text-center
    expect(innerDiv).not.toBeNull();
    expect(innerDiv).toHaveClass("flex");
    expect(innerDiv).toHaveClass("items-center");
    expect(innerDiv).toHaveClass("justify-center");
    expect(innerDiv).toHaveClass("text-center");
  });
});