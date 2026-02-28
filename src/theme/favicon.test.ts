import { describe, it, expect, beforeEach } from "vitest";
import { updateFavicon } from "./favicon";

describe("updateFavicon", () => {
  beforeEach(() => {
    document.head.innerHTML = "";
  });

  it("creates a link[rel=icon] if none exists", () => {
    expect(document.querySelector('link[rel="icon"]')).toBeNull();

    updateFavicon("#0f172a", "#818cf8");

    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    expect(link).not.toBeNull();
    expect(link!.rel).toBe("icon");
    expect(link!.href).toContain("data:image/svg+xml,");
  });

  it("updates the existing link[rel=icon] href", () => {
    const existing = document.createElement("link");
    existing.rel = "icon";
    existing.href = "/old-favicon.svg";
    document.head.appendChild(existing);

    updateFavicon("#0f172a", "#818cf8");

    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    expect(link).toBe(existing);
    expect(link!.href).toContain("data:image/svg+xml,");
    expect(link!.href).not.toBe("/old-favicon.svg");
  });

  it("contains the provided colors in the data URL", () => {
    updateFavicon("#2d1b4e", "#c084fc");

    const link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    const decoded = decodeURIComponent(link!.href);
    expect(decoded).toContain('fill="#2d1b4e"');
    expect(decoded).toContain('fill="#c084fc"');
  });

  it("does not create duplicate link elements on repeated calls", () => {
    updateFavicon("#111", "#222");
    updateFavicon("#333", "#444");

    const links = document.querySelectorAll('link[rel="icon"]');
    expect(links).toHaveLength(1);
  });
});
