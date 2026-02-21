import { render, screen } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import App from "../App";
import { ThemeProvider } from "../theme/ThemeProvider";
import { BoardProvider } from "../board/BoardProvider";

function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>
  );
}

describe("footer", () => {
  it("renders footer credit", () => {
    renderApp();
    // Leading text
    expect(screen.getByText(/Developed with ❤️ by/i)).toBeInTheDocument();
    // Linked username
    const link = screen.getByRole("link", { name: /darrenjaworski/i });
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute("href", "https://github.com/darrenjaworski");
    expect(link).toHaveAttribute("target", "_blank");
    expect(link).toHaveAttribute("rel", expect.stringContaining("noopener"));
    // Trailing text
    expect(screen.getByText(/, Copilot, and Claude\./i)).toBeInTheDocument();
  });
});
