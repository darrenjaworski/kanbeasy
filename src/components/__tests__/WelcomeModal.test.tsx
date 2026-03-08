import { render, screen, fireEvent } from "@testing-library/react";
import { WelcomeModal } from "../WelcomeModal";
import { STORAGE_KEYS } from "../../constants/storage";
import { seedKv, kvGet } from "../../utils/db";
import { describe, it, expect } from "vitest";

describe("WelcomeModal", () => {
  it("should display the modal if the user has not seen it before", () => {
    render(<WelcomeModal />);
    expect(screen.getByText(/Welcome to Kanbeasy/i)).toBeInTheDocument();
  });

  it("should not display the modal if the user has already seen it", () => {
    seedKv(STORAGE_KEYS.HAS_SEEN_WELCOME, "true");
    render(<WelcomeModal />);
    expect(screen.queryByText(/Welcome to Kanbeasy/i)).not.toBeInTheDocument();
  });

  it("should hide the modal when the user clicks the close button", () => {
    render(<WelcomeModal />);
    fireEvent.click(screen.getByText(/Get started!/i));
    expect(screen.queryByText(/Welcome to Kanbeasy/i)).not.toBeInTheDocument();
    expect(kvGet(STORAGE_KEYS.HAS_SEEN_WELCOME, null)).toBe("true");
  });
});
