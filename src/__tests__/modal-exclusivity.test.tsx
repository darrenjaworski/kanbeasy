import "@testing-library/jest-dom";
import { screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { renderApp } from "../test/renderApp";
import { seedBoard as seedBoardDb, seedKv } from "../utils/db";
import {
  makeArchivedCard,
  makeCard,
  makeColumn,
  resetCardNumber,
} from "../test/builders";
import { STORAGE_KEYS } from "../constants/storage";

/**
 * Seeds a board that enables all three header modal buttons:
 * - analytics requires at least one card in a column
 * - archive requires at least one archived card
 * - settings is always enabled
 *
 * Also marks the welcome modal as seen so it does not appear as a
 * second dialog and pollute the getAllByRole("dialog") count.
 */
function seedBoard() {
  seedKv(STORAGE_KEYS.HAS_SEEN_WELCOME, "true");
  seedBoardDb({
    columns: [
      makeColumn({
        id: "c1",
        title: "Todo",
        cards: [makeCard({ id: "card-1", title: "Task" })],
      }),
    ],
    archive: [makeArchivedCard({ id: "arch-1", title: "Archived Task" })],
  });
}

/**
 * Click a button by its aria-label, bypassing pointer-event CSS overlap.
 * When a modal is open its backdrop sits at z-50 and visually covers the
 * header, but jsdom does not enforce z-index — fireEvent.click reaches
 * the element directly without the hit-test a real browser would do.
 */
function clickButton(name: string) {
  const btn = screen.getByRole("button", { name });
  fireEvent.click(btn);
}

describe("Modal exclusivity — only one of settings/analytics/archive open at a time", () => {
  beforeEach(() => {
    resetCardNumber();
    seedBoard();
  });

  it("opening analytics while settings is open closes settings", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Open settings" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    clickButton("Open analytics");

    const dialogs = screen.getAllByRole("dialog");
    expect(dialogs).toHaveLength(1);
    expect(
      screen.getByRole("dialog", { name: /analytics/i }),
    ).toBeInTheDocument();
  });

  it("opening archive while settings is open closes settings", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Open settings" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    clickButton("Open archive");

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", { name: /archive/i }),
    ).toBeInTheDocument();
  });

  it("opening settings while analytics is open closes analytics", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Open analytics" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    clickButton("Open settings");

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it("opening archive while analytics is open closes analytics", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Open analytics" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    clickButton("Open archive");

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", { name: /archive/i }),
    ).toBeInTheDocument();
  });

  it("opening settings while archive is open closes archive", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Open archive" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    clickButton("Open settings");

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", { name: /settings/i }),
    ).toBeInTheDocument();
  });

  it("opening analytics while archive is open closes archive", async () => {
    const user = userEvent.setup();
    renderApp();

    await user.click(screen.getByRole("button", { name: "Open archive" }));
    expect(screen.getAllByRole("dialog")).toHaveLength(1);

    clickButton("Open analytics");

    expect(screen.getAllByRole("dialog")).toHaveLength(1);
    expect(
      screen.getByRole("dialog", { name: /analytics/i }),
    ).toBeInTheDocument();
  });
});
