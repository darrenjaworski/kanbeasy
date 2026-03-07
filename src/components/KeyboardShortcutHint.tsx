import { tc } from "../theme/classNames";

export function KeyboardShortcutHint() {
  return (
    <div
      className={`fixed bottom-4 right-44 z-10 inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 backdrop-blur text-xs ${tc.border} ${tc.glass} ${tc.textFaint}`}
      data-testid="keyboard-shortcut-hint"
    >
      <kbd className="font-mono font-medium">⌘k</kbd>
      <span>Shortcuts</span>
    </div>
  );
}
