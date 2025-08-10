import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "./App";
import { ThemeProvider } from "./theme/ThemeProvider";

function renderApp() {
  return render(
    <ThemeProvider>
      <App />
    </ThemeProvider>
  );
}

describe("app shell", () => {
  it("renders header and columns", () => {
    renderApp();
    expect(
      screen.getByRole("heading", { name: /kanbeasy/i })
    ).toBeInTheDocument();
    expect(screen.getByText(/to do/i)).toBeInTheDocument();
    expect(screen.getByText(/doing/i)).toBeInTheDocument();
    expect(screen.getByText(/done/i)).toBeInTheDocument();
  });

  it("opens settings and toggles dark mode", async () => {
    const user = userEvent.setup();
    renderApp();
    const btn = screen.getByRole("button", { name: /open settings/i });
    const html = document.documentElement;
    const initial = html.classList.contains("dark");
    await user.click(btn);
    const switchEl = await screen.findByRole("switch", { name: /dark mode/i });
    await user.click(switchEl);
    expect(html.classList.contains("dark")).toBe(!initial);
  });
});
