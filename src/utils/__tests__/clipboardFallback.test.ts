import { describe, expect, it, vi } from "vitest";
import {
  deleteFieldSelection,
  insertTextIntoField,
  isEditableField,
  readFieldSelection,
} from "../clipboardFallback";

function makeInput(value: string, start = value.length, end = start) {
  const el = document.createElement("input");
  el.type = "text";
  document.body.appendChild(el);
  el.value = value;
  el.setSelectionRange(start, end);
  return el;
}

function makeTextarea(value: string, start = value.length, end = start) {
  const el = document.createElement("textarea");
  document.body.appendChild(el);
  el.value = value;
  el.setSelectionRange(start, end);
  return el;
}

describe("isEditableField", () => {
  it("accepts text-like inputs and textareas", () => {
    expect(isEditableField(makeInput("a"))).toBe(true);
    expect(isEditableField(makeTextarea("a"))).toBe(true);
  });

  it("rejects non-editable targets", () => {
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    expect(isEditableField(checkbox)).toBe(false);
    expect(isEditableField(document.createElement("div"))).toBe(false);
    expect(isEditableField(null)).toBe(false);
  });

  it("rejects disabled or readonly fields", () => {
    const disabled = makeInput("a");
    disabled.disabled = true;
    expect(isEditableField(disabled)).toBe(false);

    const readonly = makeTextarea("a");
    readonly.readOnly = true;
    expect(isEditableField(readonly)).toBe(false);
  });
});

describe("readFieldSelection", () => {
  it("returns the selected substring", () => {
    expect(readFieldSelection(makeInput("hello world", 0, 5))).toBe("hello");
  });

  it("returns empty string when nothing is selected", () => {
    expect(readFieldSelection(makeInput("hello", 5, 5))).toBe("");
  });
});

describe("insertTextIntoField", () => {
  it("inserts at the caret and fires an input event", () => {
    const el = makeInput("ab", 1, 1);
    const onInput = vi.fn();
    el.addEventListener("input", onInput);

    insertTextIntoField(el, "XYZ");

    expect(el.value).toBe("aXYZb");
    expect(el.selectionStart).toBe(4);
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it("replaces the current selection", () => {
    const el = makeTextarea("hello world", 0, 5);
    insertTextIntoField(el, "goodbye");
    expect(el.value).toBe("goodbye world");
  });
});

describe("deleteFieldSelection", () => {
  it("removes the selection and fires an input event", () => {
    const el = makeInput("hello world", 5, 11);
    const onInput = vi.fn();
    el.addEventListener("input", onInput);

    deleteFieldSelection(el);

    expect(el.value).toBe("hello");
    expect(onInput).toHaveBeenCalledTimes(1);
  });

  it("is a no-op when nothing is selected", () => {
    const el = makeInput("hello", 2, 2);
    const onInput = vi.fn();
    el.addEventListener("input", onInput);

    deleteFieldSelection(el);

    expect(el.value).toBe("hello");
    expect(onInput).not.toHaveBeenCalled();
  });
});
