import "@testing-library/jest-dom";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { renderApp } from "../../../test/renderApp";
import { seedBoard as seedBoardDb } from "../../../utils/db";
import { makeColumn, resetCardNumber } from "../../../test/builders";

function seedEmptyBoard() {
  seedBoardDb({
    columns: [makeColumn({ id: "c1", title: "Todo", cards: [] })],
    archive: [],
  });
}

async function openDataSection(user: ReturnType<typeof userEvent.setup>) {
  await user.click(screen.getByRole("button", { name: "Open settings" }));
  await user.click(screen.getByRole("button", { name: "Data" }));
}

// ---------------------------------------------------------------------------
// navigator.storage mocking helpers
// ---------------------------------------------------------------------------

function mockStorage(usage: number, persisted: boolean) {
  Object.defineProperty(navigator, "storage", {
    value: {
      estimate: vi.fn().mockResolvedValue({ usage }),
      persisted: vi.fn().mockResolvedValue(persisted),
    },
    configurable: true,
    writable: true,
  });
}

function clearStorageMock() {
  Object.defineProperty(navigator, "storage", {
    value: undefined,
    configurable: true,
    writable: true,
  });
}

// ---------------------------------------------------------------------------
// formatBytes — tested via the storage estimate display
// ---------------------------------------------------------------------------

describe("DataSection — formatBytes via storage estimate", () => {
  beforeEach(() => {
    resetCardNumber();
    seedEmptyBoard();
  });

  afterEach(() => {
    clearStorageMock();
  });

  it("displays usage in KB for values between 1 KB and 1 MB", async () => {
    mockStorage(2048, false); // 2.0 KB
    const user = userEvent.setup();
    renderApp();
    await openDataSection(user);
    expect(await screen.findByText(/2\.0 KB/)).toBeInTheDocument();
  });

  it("displays usage in MB for values ≥ 1 MB", async () => {
    mockStorage(2 * 1024 * 1024, false); // 2.0 MB
    const user = userEvent.setup();
    renderApp();
    await openDataSection(user);
    expect(await screen.findByText(/2\.0 MB/)).toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// navigator.storage API — estimate and persisted
// ---------------------------------------------------------------------------

describe("DataSection — storage info panel", () => {
  beforeEach(() => {
    resetCardNumber();
    seedEmptyBoard();
  });

  afterEach(() => {
    clearStorageMock();
  });

  it("shows 'Storage used' row when estimate API is available", async () => {
    mockStorage(512, false);
    const user = userEvent.setup();
    renderApp();
    await openDataSection(user);
    expect(await screen.findByText(/Storage used/i)).toBeInTheDocument();
  });

  it("shows 'Granted' when navigator.storage.persisted() resolves true", async () => {
    mockStorage(512, true);
    const user = userEvent.setup();
    renderApp();
    await openDataSection(user);
    expect(await screen.findByText("Granted")).toBeInTheDocument();
  });

  it("shows 'Not granted' when navigator.storage.persisted() resolves false", async () => {
    mockStorage(512, false);
    const user = userEvent.setup();
    renderApp();
    await openDataSection(user);
    expect(await screen.findByText("Not granted")).toBeInTheDocument();
  });

  it("does not show storage panel when navigator.storage is unavailable", async () => {
    // storage is already undefined (default jsdom)
    const user = userEvent.setup();
    renderApp();
    await openDataSection(user);
    expect(screen.queryByText(/Storage used/i)).not.toBeInTheDocument();
  });
});

// ---------------------------------------------------------------------------
// Import button triggers hidden file input
// ---------------------------------------------------------------------------

describe("DataSection — import button", () => {
  beforeEach(() => {
    resetCardNumber();
    seedEmptyBoard();
    clearStorageMock();
  });

  it("clicking 'Import board data' triggers the hidden file input click", async () => {
    const user = userEvent.setup();
    renderApp();
    await openDataSection(user);

    const fileInput = screen.getByTestId("import-file-input");
    const clickSpy = vi.spyOn(fileInput, "click").mockImplementation(() => {});

    await user.click(
      screen.getByRole("button", { name: /import board data/i }),
    );
    expect(clickSpy).toHaveBeenCalledOnce();
  });
});
