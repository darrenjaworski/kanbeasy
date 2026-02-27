import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeModal } from "../WelcomeModal";
import { describe, beforeEach, it, expect } from "vitest";

describe("WelcomeModal", () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it("should display the modal if the user has not seen it before", () => {
    render(<WelcomeModal />);
    expect(screen.getByText(/Welcome to Kanbeasy/i)).toBeInTheDocument();
  });

  it("should not display the modal if the user has already seen it", () => {
    localStorage.setItem("hasSeenWelcome", "true");
    render(<WelcomeModal />);
    expect(screen.queryByText(/Welcome to Kanbeasy/i)).not.toBeInTheDocument();
  });

  it("should hide the modal when the user clicks the close button", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText(/Get started!/i));
    expect(screen.queryByText(/Welcome to Kanbeasy/i)).not.toBeInTheDocument();
    expect(localStorage.getItem("hasSeenWelcome")).toBe("true");
  });
});
