import { render, screen, within, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import App from "../App";
import { ThemeProvider } from "../theme/ThemeProvider";
import { BoardProvider } from "../board/BoardProvider";
import { STORAGE_KEYS } from "../constants/storage";
import { describe, it, expect, beforeEach, vi, afterEach } from "vitest";

function renderApp() {
  return render(
    <ThemeProvider>
      <BoardProvider>
        <App />
      </BoardProvider>
    </ThemeProvider>
  );
}

function makeExportJson(
  overrides: Record<string, unknown> = {}
): string {
  return JSON.stringify({
    version: 1,
    exportedAt: "2024-01-01T00:00:00.000Z",
    board: {
      columns: [
        {
          id: "imported-col",
          title: "Imported Column",
          cards: [{ id: "imported-card", title: "Imported Card" }],
        },
      ],
    },
    settings: {
      theme: "dark-slate",
      themePreference: "dark",
      cardDensity: "large",
      columnResizingEnabled: "true",
      deleteColumnWarning: "false",
    },
    ...overrides,
  });
}

describe("import board integration", () => {
  beforeEach(() => {
    localStorage.setItem(
      STORAGE_KEYS.BOARD,
      JSON.stringify({ columns: [] })
    );
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("shows import button in settings modal", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dialog = await screen.findByRole("dialog", { name: /settings/i });
    expect(
      within(dialog).getByRole("button", { name: /import board data/i })
    ).toBeInTheDocument();
  });

  it("shows importing state then import complete then resets", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dialog = await screen.findByRole("dialog", { name: /settings/i });

    const fileInput = within(dialog).getByTestId(
      "import-file-input"
    ) as HTMLInputElement;

    const file = new File([makeExportJson()], "export.json", {
      type: "application/json",
    });
    await user.upload(fileInput, file);

    // Should show "Importing…" during the min delay
    expect(within(dialog).getByText(/importing/i)).toBeInTheDocument();

    // Advance past 300ms min delay
    await act(() => vi.advanceTimersByTimeAsync(300));

    // Should show "Import complete"
    expect(within(dialog).getByText(/import complete/i)).toBeInTheDocument();

    // Advance past 600ms complete display
    await act(() => vi.advanceTimersByTimeAsync(600));

    // Should reset to idle
    expect(
      within(dialog).getByRole("button", { name: /import board data/i })
    ).toBeInTheDocument();
  });

  it("imports valid JSON and updates the board", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dialog = await screen.findByRole("dialog", { name: /settings/i });

    const fileInput = within(dialog).getByTestId(
      "import-file-input"
    ) as HTMLInputElement;

    const file = new File([makeExportJson()], "export.json", {
      type: "application/json",
    });
    await user.upload(fileInput, file);

    // Advance past min delay + complete display
    await act(() => vi.advanceTimersByTimeAsync(900));

    // Close the settings modal to see the board
    await user.click(
      within(dialog).getByRole("button", { name: /close settings/i })
    );

    // The imported column title appears in an input
    const columnInputs = screen.getAllByRole("textbox", {
      name: /column title/i,
    });
    expect(columnInputs.some((el) => (el as HTMLInputElement).value === "Imported Column")).toBe(true);
    expect(screen.getByText("Imported Card")).toBeInTheDocument();
  });

  it("shows error for invalid file", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dialog = await screen.findByRole("dialog", { name: /settings/i });

    const fileInput = within(dialog).getByTestId(
      "import-file-input"
    ) as HTMLInputElement;

    const file = new File(["not json"], "bad.json", {
      type: "application/json",
    });
    await user.upload(fileInput, file);

    // Advance past min delay so error state resolves
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(
      within(dialog).getByRole("alert")
    ).toHaveTextContent("File is not valid JSON.");
  });

  it("shows error for wrong version", async () => {
    const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
    renderApp();
    await user.click(screen.getByRole("button", { name: /open settings/i }));
    const dialog = await screen.findByRole("dialog", { name: /settings/i });

    const fileInput = within(dialog).getByTestId(
      "import-file-input"
    ) as HTMLInputElement;

    const file = new File(
      [makeExportJson({ version: 99 })],
      "future.json",
      { type: "application/json" }
    );
    await user.upload(fileInput, file);

    // Advance past min delay so error state resolves
    await act(() => vi.advanceTimersByTimeAsync(300));

    expect(
      within(dialog).getByRole("alert")
    ).toHaveTextContent(/unsupported export version/i);
  });
});
