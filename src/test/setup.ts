import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { beforeEach } from "vitest";
import { resetDb } from "../utils/db";

// Minimal ResizeObserver polyfill for jsdom tests
class RO {
  private cb: ResizeObserverCallback;
  constructor(cb: ResizeObserverCallback) {
    this.cb = cb;
  }
  observe(target: Element) {
    // fire once synchronously to approximate initial measure
    const entry = [
      { target } as ResizeObserverEntry,
    ] as unknown as ResizeObserverEntry[];
    this.cb(entry, this as unknown as ResizeObserver);
  }
  // No-op for tests (non-empty to satisfy lint)
  unobserve(): void {
    return;
  }
  disconnect(): void {
    return;
  }
}

declare global {
  var ResizeObserver: {
    new (cb: ResizeObserverCallback): ResizeObserver;
    prototype: ResizeObserver;
  };
}

if (typeof globalThis.ResizeObserver === "undefined") {
  globalThis.ResizeObserver = RO as unknown as typeof ResizeObserver;
}

// Minimal matchMedia polyfill for jsdom tests
if (typeof window.matchMedia !== "function") {
  window.matchMedia = (query: string) =>
    ({
      matches: false,
      media: query,
      onchange: null,
      addEventListener: () => {},
      removeEventListener: () => {},
      dispatchEvent: () => false,
      addListener: () => {},
      removeListener: () => {},
    }) as MediaQueryList;
}

// Clear db cache and localStorage before each test to avoid state leakage
beforeEach(() => {
  resetDb();
  localStorage.clear();
});
