import "@testing-library/jest-dom";
import { screen, within, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, it, expect, beforeEach } from "vitest";
import { renderApp } from "../test/renderApp";
import { seedBoard as seedBoardDb } from "../utils/db";
import { makeCard, makeColumn, resetCardNumber } from "../test/builders";

function seedBoard() {
  seedBoardDb({
    columns: [
      makeColumn({
        id: "c1",
        title: "Todo",
        cards: [makeCard({ id: "card-1", title: "Task" })],
      }),
    ],
    archive: [],
  });
}

function getMobileMenu() {
  return document.getElementById("mobile-menu");
}

describe("Header mobile menu", () => {
  beforeEach(() => {
    resetCardNumber();
    seedBoard();
  });

  // --- Hamburger button ---

  it("renders an 'Open menu' hamburger button", () => {
    renderApp();
    expect(
      screen.getByRole("button", { name: "Open menu" }),
    ).toBeInTheDocument();
  });

  it("hamburger has aria-expanded=false when menu is closed", () => {
    renderApp();
    expect(screen.getByRole("button", { name: "Open menu" })).toHaveAttribute(
      "aria-expanded",
      "false",
    );
  });

  // --- Opening the menu ---

  it("clicking hamburger opens the mobile menu overlay", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(getMobileMenu()).toBeInTheDocument();
  });

  it("aria-label switches to 'Close menu' when the menu is open", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      screen.getByRole("button", { name: "Close menu" }),
    ).toBeInTheDocument();
  });

  // --- Closing the menu ---

  it("clicking 'Close menu' closes the overlay", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(screen.getByRole("button", { name: "Close menu" }));
    expect(getMobileMenu()).not.toBeInTheDocument();
  });

  it("clicking the backdrop closes the menu", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(getMobileMenu()).toBeInTheDocument();

    // The backdrop is a dedicated div with aria-hidden="true" and its own onClick.
    // Fire directly on that element — clicking document.body does not reach it.
    const backdrop = document.querySelector(
      'div[aria-hidden="true"]',
    ) as HTMLElement;
    fireEvent.click(backdrop);
    expect(getMobileMenu()).not.toBeInTheDocument();
  });

  // --- Mobile menu content ---

  it("mobile menu contains an Open settings button", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      within(getMobileMenu()!).getByRole("button", { name: "Open settings" }),
    ).toBeInTheDocument();
  });

  it("mobile menu contains an Open archive button", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      within(getMobileMenu()!).getByRole("button", { name: "Open archive" }),
    ).toBeInTheDocument();
  });

  it("mobile menu contains an Open analytics button", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    expect(
      within(getMobileMenu()!).getByRole("button", { name: "Open analytics" }),
    ).toBeInTheDocument();
  });

  // --- Mobile menu actions ---

  it("clicking Settings in the mobile menu opens the settings modal and closes the menu", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    await user.click(
      within(getMobileMenu()!).getByRole("button", { name: "Open settings" }),
    );
    expect(getMobileMenu()).not.toBeInTheDocument();
    expect(
      screen.getByRole("dialog", { name: /settings/i }),
    ).toBeInTheDocument();
  });

  // --- Mobile ViewToggle (covers ViewToggle mobile branch) ---

  it("mobile menu renders ViewToggle as a grid radiogroup without tooltips", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));
    // ViewToggle mobile renders a role="radiogroup" grid (no Tooltip wrappers)
    expect(
      within(getMobileMenu()!).getByRole("radiogroup", { name: /view mode/i }),
    ).toBeInTheDocument();
  });

  it("clicking List in the mobile ViewToggle switches to list view", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const mobileToggle = within(getMobileMenu()!).getByRole("radiogroup", {
      name: /view mode/i,
    });
    const listBtn = within(mobileToggle).getByRole("radio", {
      name: /list view/i,
    });
    await user.click(listBtn);
    expect(listBtn).toHaveAttribute("aria-checked", "true");
  });

  it("mobile ViewToggle board button starts as active", async () => {
    const user = userEvent.setup();
    renderApp();
    await user.click(screen.getByRole("button", { name: "Open menu" }));

    const mobileToggle = within(getMobileMenu()!).getByRole("radiogroup", {
      name: /view mode/i,
    });
    expect(
      within(mobileToggle).getByRole("radio", { name: /board view/i }),
    ).toHaveAttribute("aria-checked", "true");
  });
});
