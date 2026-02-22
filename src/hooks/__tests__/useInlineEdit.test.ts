import { describe, it, expect, vi, beforeEach } from "vitest";
import { renderHook } from "@testing-library/react";
import { useInlineEdit } from "../useInlineEdit";

function makeEvent(overrides: Record<string, unknown> = {}) {
  return {
    key: "",
    shiftKey: false,
    preventDefault: vi.fn(),
    currentTarget: { blur: vi.fn(), value: "" },
    ...overrides,
  } as unknown as React.KeyboardEvent<HTMLInputElement> &
    React.FocusEvent<HTMLInputElement>;
}

describe("useInlineEdit", () => {
  const onSave = vi.fn();
  const onRevert = vi.fn();

  function setup(
    overrides: { multiline?: boolean; originalValue?: string } = {},
  ) {
    return renderHook(() =>
      useInlineEdit({
        originalValue: overrides.originalValue ?? "Original",
        onSave,
        onRevert,
        multiline: overrides.multiline,
      }),
    );
  }

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("onKeyDown", () => {
    it("blurs on Enter", () => {
      const { result } = setup();
      const e = makeEvent({ key: "Enter" });
      result.current.onKeyDown(e);

      expect(e.preventDefault).toHaveBeenCalled();
      expect((e.currentTarget as HTMLInputElement).blur).toHaveBeenCalled();
    });

    it("reverts and blurs on Escape", () => {
      const { result } = setup();
      const e = makeEvent({ key: "Escape" });
      result.current.onKeyDown(e);

      expect(onRevert).toHaveBeenCalled();
      expect((e.currentTarget as HTMLInputElement).blur).toHaveBeenCalled();
    });

    it("does nothing for other keys", () => {
      const { result } = setup();
      const e = makeEvent({ key: "a" });
      result.current.onKeyDown(e);

      expect(e.preventDefault).not.toHaveBeenCalled();
      expect(onRevert).not.toHaveBeenCalled();
    });

    it("allows Shift+Enter in multiline mode", () => {
      const { result } = setup({ multiline: true });
      const e = makeEvent({ key: "Enter", shiftKey: true });
      result.current.onKeyDown(e);

      expect(e.preventDefault).not.toHaveBeenCalled();
      expect((e.currentTarget as HTMLInputElement).blur).not.toHaveBeenCalled();
    });

    it("blurs on Enter without Shift in multiline mode", () => {
      const { result } = setup({ multiline: true });
      const e = makeEvent({ key: "Enter", shiftKey: false });
      result.current.onKeyDown(e);

      expect(e.preventDefault).toHaveBeenCalled();
      expect((e.currentTarget as HTMLInputElement).blur).toHaveBeenCalled();
    });
  });

  describe("onBlur", () => {
    it("calls onSave when value changed", () => {
      const { result } = setup({ originalValue: "Original" });
      const e = makeEvent({
        currentTarget: { value: "Updated", blur: vi.fn() },
      });
      result.current.onBlur(e as unknown as React.FocusEvent<HTMLInputElement>);

      expect(onSave).toHaveBeenCalledWith("Updated");
    });

    it("does not call onSave when value is unchanged", () => {
      const { result } = setup({ originalValue: "Original" });
      const e = makeEvent({
        currentTarget: { value: "Original", blur: vi.fn() },
      });
      result.current.onBlur(e as unknown as React.FocusEvent<HTMLInputElement>);

      expect(onSave).not.toHaveBeenCalled();
    });

    it("calls onRevert when value is empty", () => {
      const { result } = setup({ originalValue: "Original" });
      const e = makeEvent({ currentTarget: { value: "   ", blur: vi.fn() } });
      result.current.onBlur(e as unknown as React.FocusEvent<HTMLInputElement>);

      expect(onRevert).toHaveBeenCalled();
      expect(onSave).not.toHaveBeenCalled();
    });

    it("trims whitespace before comparing", () => {
      const { result } = setup({ originalValue: "Hello" });
      const e = makeEvent({
        currentTarget: { value: "  Hello  ", blur: vi.fn() },
      });
      result.current.onBlur(e as unknown as React.FocusEvent<HTMLInputElement>);

      expect(onSave).not.toHaveBeenCalled();
    });

    it("does not save after Escape (revert via blur is skipped)", () => {
      const { result } = setup({ originalValue: "Original" });

      // Simulate Escape keydown first
      const keyEvent = makeEvent({ key: "Escape" });
      result.current.onKeyDown(keyEvent);

      // Then blur fires — should not save
      const blurEvent = makeEvent({
        currentTarget: { value: "Changed", blur: vi.fn() },
      });
      result.current.onBlur(
        blurEvent as unknown as React.FocusEvent<HTMLInputElement>,
      );

      expect(onSave).not.toHaveBeenCalled();
    });
  });
});
