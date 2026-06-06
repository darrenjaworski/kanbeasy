import { describe, it, expect, vi } from "vitest";
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
  function setup() {
    const onToggle = vi.fn();
    renderHook(() => useCommandPaletteShortcut(() => onToggle()));
    return { onToggle };
  }

  it("fires on Cmd+K", () => {
    const { onToggle } = setup();
    fireKeyDown("k", { metaKey: true });
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("fires on Ctrl+K", () => {
    const { onToggle } = setup();
    fireKeyDown("k", { ctrlKey: true });
    expect(onToggle).toHaveBeenCalledOnce();
  });

  it("works even when focused on an input", () => {
    const { onToggle } = setup();
    const input = document.createElement("input");
    document.body.appendChild(input);
    input.focus();
    fireKeyDown("k", { metaKey: true }, input);
    expect(onToggle).toHaveBeenCalledOnce();
    document.body.removeChild(input);
  });

  it("does not fire without modifier key", () => {
    const { onToggle } = setup();
    fireKeyDown("k", {});
    expect(onToggle).not.toHaveBeenCalled();
  });

  it("ignores unrelated key combinations", () => {
    const { onToggle } = setup();
    fireKeyDown("s", { metaKey: true });
    fireKeyDown("a", { ctrlKey: true });
    expect(onToggle).not.toHaveBeenCalled();
  });
});
