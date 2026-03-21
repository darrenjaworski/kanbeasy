import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useIsMobile } from "../useIsMobile";

function makeMql(matches: boolean) {
  const listeners = new Set<() => void>();
  return {
    matches,
    addEventListener: vi.fn((_: string, cb: () => void) => listeners.add(cb)),
    removeEventListener: vi.fn((_: string, cb: () => void) =>
      listeners.delete(cb),
    ),
    _fire: () => listeners.forEach((cb) => cb()),
  };
}

describe("useIsMobile", () => {
  let mql: ReturnType<typeof makeMql>;

  beforeEach(() => {
    mql = makeMql(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mql as unknown as MediaQueryList,
    );
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("returns false when viewport is desktop", () => {
    mql = makeMql(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mql as unknown as MediaQueryList,
    );
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);
  });

  it("returns true when viewport is mobile", () => {
    mql = makeMql(true);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mql as unknown as MediaQueryList,
    );
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(true);
  });

  it("updates when media query fires a change event", () => {
    mql = makeMql(false);
    vi.spyOn(window, "matchMedia").mockReturnValue(
      mql as unknown as MediaQueryList,
    );
    const { result } = renderHook(() => useIsMobile());
    expect(result.current).toBe(false);

    // Simulate the breakpoint crossing to mobile
    mql.matches = true;
    act(() => mql._fire());
    expect(result.current).toBe(true);
  });

  it("removes the event listener on unmount", () => {
    const { unmount } = renderHook(() => useIsMobile());
    unmount();
    expect(mql.removeEventListener).toHaveBeenCalled();
  });
});
