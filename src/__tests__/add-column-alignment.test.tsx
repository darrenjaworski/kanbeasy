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
    // Should NOT have text-center (using flexbox centering instead)
    expect(button).not.toHaveClass("text-center");
    
    // Check inner div classes for centering
    expect(innerDiv).toHaveClass("flex");
    expect(innerDiv).toHaveClass("items-center");
    expect(innerDiv).toHaveClass("justify-center");
  });

  it("should center content properly using flexbox", () => {
    const handleOnClick = () => {};
    render(<AddColumn handleOnClick={handleOnClick} />);
    
    const button = screen.getByTestId("add-column-button");
    const innerDiv = button.querySelector("div");
    
    // Verify the button text content is present
    expect(button).toHaveTextContent("Add Column");
    
    // Verify flexbox structure
    expect(innerDiv).not.toBeNull();
    expect(innerDiv).toHaveClass("flex");
    expect(innerDiv).toHaveClass("items-center");
    expect(innerDiv).toHaveClass("justify-center");
  });
});