import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { OwlBuddy } from "../OwlBuddy";
import { owlTips, nightOwlTips } from "../../constants/owlTips";

const mockTheme = {
  owlModeEnabled: false,
};

vi.mock("../../theme/useTheme", () => ({
  useTheme: () => mockTheme,
}));

let mockIsNight = false;
vi.mock("../../utils/isNightOwlHour", () => ({
  isNightOwlHour: () => mockIsNight,
}));

describe("OwlBuddy", () => {
  beforeEach(() => {
    mockTheme.owlModeEnabled = false;
    mockIsNight = false;
  });

  it("does not render when owl mode is disabled", () => {
    const { container } = render(<OwlBuddy />);
    expect(container.innerHTML).toBe("");
  });

  it("renders owl button when enabled", () => {
    mockTheme.owlModeEnabled = true;
    render(<OwlBuddy />);

    expect(
      screen.getByRole("button", { name: "Owl buddy" }),
    ).toBeInTheDocument();
  });

  it("opens speech bubble with tip text on click", async () => {
    mockTheme.owlModeEnabled = true;
    const user = userEvent.setup();
    render(<OwlBuddy />);

    await user.click(screen.getByRole("button", { name: "Owl buddy" }));

    const tipText = screen.getByText((_content, element) => {
      if (!element || element.tagName !== "P") return false;
      return owlTips.includes(element.textContent ?? "");
    });
    expect(tipText).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Thanks!" })).toBeInTheDocument();
  });

  it("closes speech bubble on dismiss", async () => {
    mockTheme.owlModeEnabled = true;
    const user = userEvent.setup();
    render(<OwlBuddy />);

    await user.click(screen.getByRole("button", { name: "Owl buddy" }));
    expect(screen.getByRole("button", { name: "Thanks!" })).toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Thanks!" }));
    expect(
      screen.queryByRole("button", { name: "Thanks!" }),
    ).not.toBeInTheDocument();
  });

  it("shows a new tip when 'One more' is clicked", async () => {
    mockTheme.owlModeEnabled = true;
    const user = userEvent.setup();
    render(<OwlBuddy />);

    await user.click(screen.getByRole("button", { name: "Owl buddy" }));
    const firstTip = screen.getByText((_content, element) => {
      if (!element || element.tagName !== "P") return false;
      return owlTips.includes(element.textContent ?? "");
    }).textContent;

    await user.click(screen.getByRole("button", { name: "One more" }));
    const secondTip = screen.getByText((_content, element) => {
      if (!element || element.tagName !== "P") return false;
      return owlTips.includes(element.textContent ?? "");
    }).textContent;

    expect(firstTip).not.toBe(secondTip);
    // Dialog should still be open
    expect(screen.getByRole("button", { name: "Thanks!" })).toBeInTheDocument();
  });

  it("closes speech bubble when clicking outside", async () => {
    mockTheme.owlModeEnabled = true;
    const user = userEvent.setup();
    render(<OwlBuddy />);

    await user.click(screen.getByRole("button", { name: "Owl buddy" }));
    expect(screen.getByRole("button", { name: "Thanks!" })).toBeInTheDocument();

    await user.click(document.body);
    expect(
      screen.queryByRole("button", { name: "Thanks!" }),
    ).not.toBeInTheDocument();
  });

  it("cycles through all tips without repeats before reshuffling", async () => {
    mockTheme.owlModeEnabled = true;
    const user = userEvent.setup();
    render(<OwlBuddy />);

    const seen: string[] = [];

    for (let i = 0; i < owlTips.length; i++) {
      await user.click(screen.getByRole("button", { name: "Owl buddy" }));
      const tipEl = screen.getByText((_content, element) => {
        if (!element || element.tagName !== "P") return false;
        return owlTips.includes(element.textContent ?? "");
      });
      seen.push(tipEl.textContent ?? "");
      await user.click(screen.getByRole("button", { name: "Thanks!" }));
    }

    // Every tip should appear exactly once in a full cycle
    expect(new Set(seen).size).toBe(owlTips.length);
  });

  it("shows a special message after all tips have been seen", async () => {
    mockTheme.owlModeEnabled = true;
    const user = userEvent.setup();
    render(<OwlBuddy />);

    // Exhaust the entire deck
    for (let i = 0; i < owlTips.length; i++) {
      await user.click(screen.getByRole("button", { name: "Owl buddy" }));
      await user.click(screen.getByRole("button", { name: "Thanks!" }));
    }

    // Next click should show the end-of-deck message
    await user.click(screen.getByRole("button", { name: "Owl buddy" }));
    expect(
      screen.getByText(/You've seen every single tip/),
    ).toBeInTheDocument();
  });

  describe("night owl mode", () => {
    it("renders sleepy owl icon during night hours", () => {
      mockTheme.owlModeEnabled = true;
      mockIsNight = true;
      render(<OwlBuddy />);

      expect(screen.getByTestId("sleepy-owl-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("owl-icon")).not.toBeInTheDocument();
    });

    it("renders normal owl icon during day hours", () => {
      mockTheme.owlModeEnabled = true;
      mockIsNight = false;
      render(<OwlBuddy />);

      expect(screen.getByTestId("owl-icon")).toBeInTheDocument();
      expect(screen.queryByTestId("sleepy-owl-icon")).not.toBeInTheDocument();
    });

    it("shows night tips during night hours", async () => {
      mockTheme.owlModeEnabled = true;
      mockIsNight = true;
      const user = userEvent.setup();
      render(<OwlBuddy />);

      await user.click(screen.getByRole("button", { name: "Owl buddy" }));

      const tipEl = screen.getByTestId("owl-tip");
      expect(nightOwlTips.includes(tipEl.textContent ?? "")).toBe(true);
    });

    it("shows day tips during day hours", async () => {
      mockTheme.owlModeEnabled = true;
      mockIsNight = false;
      const user = userEvent.setup();
      render(<OwlBuddy />);

      await user.click(screen.getByRole("button", { name: "Owl buddy" }));

      const tipEl = screen.getByTestId("owl-tip");
      expect(owlTips.includes(tipEl.textContent ?? "")).toBe(true);
    });

    it("shows 'Good night!' dismiss button during night hours", async () => {
      mockTheme.owlModeEnabled = true;
      mockIsNight = true;
      const user = userEvent.setup();
      render(<OwlBuddy />);

      await user.click(screen.getByRole("button", { name: "Owl buddy" }));

      expect(
        screen.getByRole("button", { name: "Good night!" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Thanks!" }),
      ).not.toBeInTheDocument();
    });

    it("shows 'Thanks!' dismiss button during day hours", async () => {
      mockTheme.owlModeEnabled = true;
      mockIsNight = false;
      const user = userEvent.setup();
      render(<OwlBuddy />);

      await user.click(screen.getByRole("button", { name: "Owl buddy" }));

      expect(
        screen.getByRole("button", { name: "Thanks!" }),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole("button", { name: "Good night!" }),
      ).not.toBeInTheDocument();
    });
  });
});
