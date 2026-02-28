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
        label="Warn before deleting columns with cards"
        checked={deleteColumnWarningEnabled}
        onChange={setDeleteColumnWarningEnabled}
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
