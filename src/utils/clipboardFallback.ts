/**
 * Clipboard fallback helpers for VS Code host mode.
 *
 * When the app runs inside the VS Code extension's webview, it lives in a
 * cross-origin iframe nested in a webview. VS Code drops the native
 * copy/paste/cut keyboard shortcuts and context-menu events for nested-iframe
 * content (microsoft/vscode#129178, #180234), so the browser's default paste
 * never fires. These helpers let us drive the field contents ourselves using
 * the async Clipboard API, which the extension enables by delegating
 * `clipboard-read; clipboard-write` to the iframe.
 *
 * Mutations go through the elements' native value setter + a dispatched `input`
 * event so React-controlled inputs pick the change up via their existing
 * `onChange` handlers.
 */

export type EditableField = HTMLInputElement | HTMLTextAreaElement;

const TEXT_INPUT_TYPES = new Set([
  "text",
  "search",
  "url",
  "email",
  "tel",
  "password",
  "number",
  "",
]);

/** Narrow an event target to a text-like input or textarea. */
export function isEditableField(
  target: EventTarget | null,
): target is EditableField {
  if (target instanceof HTMLTextAreaElement) {
    return !target.disabled && !target.readOnly;
  }
  if (target instanceof HTMLInputElement) {
    return (
      !target.disabled && !target.readOnly && TEXT_INPUT_TYPES.has(target.type)
    );
  }
  return false;
}

function setNativeValue(el: EditableField, value: string): void {
  const proto =
    el instanceof HTMLTextAreaElement
      ? HTMLTextAreaElement.prototype
      : HTMLInputElement.prototype;
  // Grab the prototype's value setter so we bypass React's overridden setter and
  // then dispatch a real input event; this is how React-controlled inputs pick up
  // programmatic changes. The setter is invoked immediately via .call, so the
  // unbound-method concern does not apply here.
  // eslint-disable-next-line @typescript-eslint/unbound-method
  const setter = Object.getOwnPropertyDescriptor(proto, "value")?.set;
  if (setter) {
    setter.call(el, value);
  } else {
    el.value = value;
  }
}

/** The currently selected substring within the field (empty if no selection). */
export function readFieldSelection(el: EditableField): string {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  return el.value.slice(start, end);
}

/**
 * Replace the current selection (or insert at the caret) with `text`, leaving
 * the caret after the inserted text. Fires an `input` event so React updates.
 */
export function insertTextIntoField(el: EditableField, text: string): void {
  const start = el.selectionStart ?? el.value.length;
  const end = el.selectionEnd ?? el.value.length;
  const next = el.value.slice(0, start) + text + el.value.slice(end);
  setNativeValue(el, next);
  const caret = start + text.length;
  el.setSelectionRange(caret, caret);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}

/**
 * Delete the current selection (no-op when nothing is selected). Fires an
 * `input` event so React updates. Used by cut after the text is copied.
 */
export function deleteFieldSelection(el: EditableField): void {
  const start = el.selectionStart ?? 0;
  const end = el.selectionEnd ?? 0;
  if (start === end) return;
  const next = el.value.slice(0, start) + el.value.slice(end);
  setNativeValue(el, next);
  el.setSelectionRange(start, start);
  el.dispatchEvent(new Event("input", { bubbles: true }));
}
