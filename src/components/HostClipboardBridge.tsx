import { useCallback, useEffect, useRef, useState } from "react";
import { tc } from "../theme/classNames";
import {
  deleteFieldSelection,
  insertTextIntoField,
  isEditableField,
  readFieldSelection,
  type EditableField,
} from "../utils/clipboardFallback";
import { isHostMode } from "../utils/hostBridge";

/**
 * Restores copy / cut / paste / select-all for card text fields when the app
 * runs inside the VS Code extension webview.
 *
 * In that environment the app is a cross-origin iframe nested in a webview, and
 * VS Code drops the native clipboard keyboard shortcuts and context-menu for
 * nested-iframe content (microsoft/vscode#129178, #180234). This bridge
 * intercepts the shortcuts and right-click on text inputs and drives the
 * clipboard via the async Clipboard API (the extension delegates
 * `clipboard-read; clipboard-write` to the iframe so this is permitted).
 *
 * It renders nothing and installs no listeners outside host mode, so the
 * standalone web app is completely unaffected.
 */

type MenuState = {
  x: number;
  y: number;
  field: EditableField;
};

async function copySelection(field: EditableField): Promise<void> {
  const selection = readFieldSelection(field);
  if (!selection) return;
  try {
    await navigator.clipboard.writeText(selection);
  } catch {
    // Clipboard write can reject if permission/focus is lost; nothing to undo.
  }
}

async function cutSelection(field: EditableField): Promise<void> {
  const selection = readFieldSelection(field);
  if (!selection) return;
  try {
    await navigator.clipboard.writeText(selection);
    deleteFieldSelection(field);
  } catch {
    // Leave the field untouched if the copy half failed.
  }
}

async function pasteIntoField(field: EditableField): Promise<void> {
  try {
    const text = await navigator.clipboard.readText();
    if (text) insertTextIntoField(field, text);
  } catch {
    // Reading can reject without clipboard-read permission; nothing to insert.
  }
}

export function HostClipboardBridge() {
  const enabled = isHostMode();
  const [menu, setMenu] = useState<MenuState | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => setMenu(null), []);

  // Keyboard shortcuts: Cmd/Ctrl + C / X / V / A on a text field.
  useEffect(() => {
    if (!enabled) return;
    function onKeyDown(e: KeyboardEvent) {
      if (!isEditableField(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (!mod || e.altKey) return;
      const field = e.target;
      switch (e.key.toLowerCase()) {
        case "c":
          e.preventDefault();
          void copySelection(field);
          break;
        case "x":
          e.preventDefault();
          void cutSelection(field);
          break;
        case "v":
          e.preventDefault();
          void pasteIntoField(field);
          break;
        case "a":
          e.preventDefault();
          field.select();
          break;
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [enabled]);

  // Right-click on a text field opens a custom Cut/Copy/Paste menu.
  useEffect(() => {
    if (!enabled) return;
    function onContextMenu(e: MouseEvent) {
      if (!isEditableField(e.target)) return;
      e.preventDefault();
      setMenu({ x: e.clientX, y: e.clientY, field: e.target });
    }
    document.addEventListener("contextmenu", onContextMenu);
    return () => document.removeEventListener("contextmenu", onContextMenu);
  }, [enabled]);

  // Dismiss the menu on outside interaction.
  useEffect(() => {
    if (!menu) return;
    function onPointerDown(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenu(null);
      }
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setMenu(null);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    window.addEventListener("resize", closeMenu);
    window.addEventListener("scroll", closeMenu, true);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
      window.removeEventListener("resize", closeMenu);
      window.removeEventListener("scroll", closeMenu, true);
    };
  }, [menu, closeMenu]);

  if (!enabled || !menu) return null;

  const runAction = (action: (field: EditableField) => Promise<void>) => {
    const { field } = menu;
    field.focus();
    void action(field).finally(closeMenu);
  };

  const hasSelection = readFieldSelection(menu.field).length > 0;
  const itemClass = `block w-full px-3 py-1.5 text-left text-sm ${tc.text} ${tc.bgHover} disabled:opacity-40 disabled:cursor-default`;

  return (
    <div
      ref={menuRef}
      role="menu"
      className={`fixed z-50 min-w-[8rem] overflow-hidden rounded-md border ${tc.border} ${tc.glassOpaque} py-1 shadow-lg backdrop-blur-md`}
      style={{ top: menu.y, left: menu.x }}
      data-testid="host-clipboard-menu"
    >
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        disabled={!hasSelection}
        onClick={() => runAction(cutSelection)}
      >
        Cut
      </button>
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        disabled={!hasSelection}
        onClick={() => runAction(copySelection)}
      >
        Copy
      </button>
      <button
        type="button"
        role="menuitem"
        className={itemClass}
        onClick={() => runAction(pasteIntoField)}
      >
        Paste
      </button>
    </div>
  );
}
