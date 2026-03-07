import { useTheme } from "../../theme/useTheme";
import { ToggleSwitch } from "../shared/ToggleSwitch";

export function BoardSettingsSection() {
  const {
    columnResizingEnabled,
    setColumnResizingEnabled,
    deleteColumnWarningEnabled,
    setDeleteColumnWarningEnabled,
    owlModeEnabled,
    setOwlModeEnabled,
    keyboardShortcutsEnabled,
    setKeyboardShortcutsEnabled,
  } = useTheme();

  return (
    <div className="space-y-3 text-sm font-medium">
      <ToggleSwitch
        id="column-resizing"
        label="Column resizing"
        checked={columnResizingEnabled}
        onChange={setColumnResizingEnabled}
      />
      <ToggleSwitch
        id="delete-column-warning"
        label="Warn before removing columns with cards"
        checked={deleteColumnWarningEnabled}
        onChange={setDeleteColumnWarningEnabled}
      />
      <ToggleSwitch
        id="keyboard-shortcuts"
        label="Keyboard shortcuts"
        description="Use Cmd+K to open the command palette"
        checked={keyboardShortcutsEnabled}
        onChange={setKeyboardShortcutsEnabled}
      />
      <ToggleSwitch
        id="owl-mode"
        label="Owl assistant"
        description="A friendly owl that shares productivity tips and jokes"
        checked={owlModeEnabled}
        onChange={setOwlModeEnabled}
      />
    </div>
  );
}
