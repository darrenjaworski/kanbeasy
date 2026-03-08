import "@testing-library/jest-dom";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { SettingsSection } from "../SettingsSection";
import { kvGet } from "../../../utils/db";
import { STORAGE_KEYS } from "../../../constants/storage";

function renderSections() {
  return render(
    <>
      <SettingsSection title="Alpha">
        <p>Alpha content</p>
      </SettingsSection>
      <SettingsSection title="Beta">
        <p>Beta content</p>
      </SettingsSection>
      <SettingsSection title="Gamma">
        <p>Gamma content</p>
      </SettingsSection>
    </>,
  );
}

describe("SettingsSection", () => {
  it("starts collapsed by default", () => {
    renderSections();
    expect(screen.queryByText("Alpha content")).not.toBeInTheDocument();
    expect(screen.queryByText("Beta content")).not.toBeInTheDocument();
  });

  it("expands when clicked", () => {
    renderSections();
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    expect(screen.getByText("Alpha content")).toBeInTheDocument();
  });

  it("persists each section state independently to IndexedDB", () => {
    renderSections();

    // Open Alpha and Beta, leave Gamma closed
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Beta" }));

    const states = kvGet<Record<string, boolean>>(
      STORAGE_KEYS.SETTINGS_SECTIONS,
      {},
    );
    expect(states["alpha"]).toBe(true);
    expect(states["beta"]).toBe(true);
    expect(states["gamma"]).toBeUndefined();
  });

  it("restores each section state from IndexedDB on remount", () => {
    renderSections();

    // Open Alpha and Beta
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Beta" }));
    expect(screen.getByText("Alpha content")).toBeInTheDocument();
    expect(screen.getByText("Beta content")).toBeInTheDocument();

    // Unmount and remount (simulates closing and reopening the modal)
    cleanup();
    renderSections();

    // Both should still be open; Gamma should still be closed
    expect(screen.getByText("Alpha content")).toBeInTheDocument();
    expect(screen.getByText("Beta content")).toBeInTheDocument();
    expect(screen.queryByText("Gamma content")).not.toBeInTheDocument();
  });

  it("remembers closing a previously open section", () => {
    renderSections();

    // Open Alpha, then close it
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));
    fireEvent.click(screen.getByRole("button", { name: "Alpha" }));

    // Remount
    cleanup();
    renderSections();

    expect(screen.queryByText("Alpha content")).not.toBeInTheDocument();
  });

  it("respects defaultOpen when no persisted state exists", () => {
    render(
      <SettingsSection title="Zeta" defaultOpen>
        <p>Zeta content</p>
      </SettingsSection>,
    );
    expect(screen.getByText("Zeta content")).toBeInTheDocument();
  });
});
