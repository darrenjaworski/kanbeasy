import { renderHook, act } from "@testing-library/react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { useSwipeNavigation } from "../useSwipeNavigation";

function makeTouch(x: number, y: number): Touch {
  return { clientX: x, clientY: y } as Touch;
}

function makeTouchEvent(touches: Touch[]): React.TouchEvent {
  return {
    touches: { 0: touches[0] } as unknown as TouchList,
    changedTouches: { 0: touches[0] } as unknown as TouchList,
  } as React.TouchEvent;
}

describe("useSwipeNavigation", () => {
  const onSwipeLeft = vi.fn();
  const onSwipeRight = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("calls onSwipeLeft on a left swipe exceeding threshold", () => {
    const { result } = renderHook(() =>
      useSwipeNavigation({ onSwipeLeft, onSwipeRight }),
    );
    act(() =>
      result.current.onTouchStart(makeTouchEvent([makeTouch(200, 100)])),
    );
    act(() => result.current.onTouchEnd(makeTouchEvent([makeTouch(100, 105)])));
    expect(onSwipeLeft).toHaveBeenCalledTimes(1);
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("calls onSwipeRight on a right swipe exceeding threshold", () => {
    const { result } = renderHook(() =>
      useSwipeNavigation({ onSwipeLeft, onSwipeRight }),
    );
    act(() =>
      result.current.onTouchStart(makeTouchEvent([makeTouch(100, 100)])),
    );
    act(() => result.current.onTouchEnd(makeTouchEvent([makeTouch(200, 105)])));
    expect(onSwipeRight).toHaveBeenCalledTimes(1);
    expect(onSwipeLeft).not.toHaveBeenCalled();
  });

  it("does not fire when horizontal delta is below threshold", () => {
    const { result } = renderHook(() =>
      useSwipeNavigation({ onSwipeLeft, onSwipeRight, threshold: 50 }),
    );
    act(() =>
      result.current.onTouchStart(makeTouchEvent([makeTouch(100, 100)])),
    );
    act(() => result.current.onTouchEnd(makeTouchEvent([makeTouch(130, 100)])));
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("does not fire when vertical delta dominates (scroll intent)", () => {
    const { result } = renderHook(() =>
      useSwipeNavigation({ onSwipeLeft, onSwipeRight }),
    );
    act(() =>
      result.current.onTouchStart(makeTouchEvent([makeTouch(100, 100)])),
    );
    // dx=60 but dy=100 → vertical dominates
    act(() => result.current.onTouchEnd(makeTouchEvent([makeTouch(160, 200)])));
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });

  it("does not fire when enabled=false", () => {
    const { result } = renderHook(() =>
      useSwipeNavigation({ onSwipeLeft, onSwipeRight, enabled: false }),
    );
    act(() =>
      result.current.onTouchStart(makeTouchEvent([makeTouch(200, 100)])),
    );
    act(() => result.current.onTouchEnd(makeTouchEvent([makeTouch(50, 100)])));
    expect(onSwipeLeft).not.toHaveBeenCalled();
    expect(onSwipeRight).not.toHaveBeenCalled();
  });
});
