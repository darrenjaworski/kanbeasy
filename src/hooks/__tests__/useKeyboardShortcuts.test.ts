import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useCommandPaletteShortcut } from "../useKeyboardShortcuts";

function fireKeyDown(
  key: string,
  opts: Partial<KeyboardEventInit> = {},
  target?: HTMLElement,
) {
  const event = new KeyboardEvent("keydown", {
    key,
    bubbles: true,
    cancelable: true,
    ...opts,
  });
  (target ?? document).dispatchEvent(event);
  return event;
}

describe("useCommandPaletteShortcut", () => {
  const onToggle = vi.fn();

  beforeEach(() => {
    onToggle.mockClear();
    renderHook(() => useCommandPaletteShortcut(() => onToggle()));
  });

  it("fires on Cmd+K", () => {
    fireKeyDown("k", { metaKey: true });
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("fires on Ctrl+K", () => {
    fireKeyDown("k", { ctrlKey: true });
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("works even when focused on an input", () => {
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireKeyDown("k", { metaKey: true }, input);
    expect(onToggle).toHaveBeenCalledOnce();
    document.body.removeChild(input);
  });

  it("does not fire without modifier key", () => {
    fireKeyDown("k", {});
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("ignores unrelated key combinations", () => {
    fireKeyDown("s", { metaKey: true });
    fireKeyDown("a", { ctrlKey: true });
    expect(onToggle).not.toHaveBeenCalled();
  });
});
