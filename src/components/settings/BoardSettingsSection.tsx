import { useTheme } from "../../theme/useTheme";
import {
  DensitySmallIcon,
  DensityMediumIcon,
  DensityLargeIcon,
} from "../icons";
import { tc } from "../../theme/classNames";
import { ToggleSwitch } from "../shared/ToggleSwitch";

export function BoardSettingsSection() {
  const {
    cardDensity,
    setCardDensity,
    columnResizingEnabled,
    setColumnResizingEnabled,
    deleteColumnWarningEnabled,
    setDeleteColumnWarningEnabled,
    owlModeEnabled,
    setOwlModeEnabled,
  } = useTheme();

  return (
    <div className="space-y-3 text-sm font-medium mb-4">
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
        checked={owlModeEnabled}
        onChange={setOwlModeEnabled}
      />
      <fieldset className="flex items-center justify-between gap-3 border-0 p-0 m-0">
        <legend className="sr-only">Card density</legend>
        <span aria-hidden>Card density</span>
        <div className={`${tc.buttonGroup} rounded-full`}>
          <button
            type="button"
            onClick={() => setCardDensity("small")}
            title="Compact"
            aria-pressed={cardDensity === "small"}
            className={`h-9 w-9 ${tc.iconButton} ${
              cardDensity === "small" ? tc.pressed : ""
            }`}
          >
            <DensitySmallIcon />
          </button>
          <span aria-hidden className={`${tc.separator} h-7 w-px`} />
          <button
            type="button"
            onClick={() => setCardDensity("medium")}
            title="Comfortable"
            aria-pressed={cardDensity === "medium"}
            className={`h-9 w-9 ${tc.iconButton} ${
              cardDensity === "medium" ? tc.pressed : ""
            }`}
          >
            <DensityMediumIcon />
          </button>
          <span aria-hidden className={`${tc.separator} h-7 w-px`} />
          <button
            type="button"
            onClick={() => setCardDensity("large")}
            title="Spacious"
            aria-pressed={cardDensity === "large"}
            className={`h-9 w-9 ${tc.iconButton} ${
              cardDensity === "large" ? tc.pressed : ""
            }`}
          >
            <DensityLargeIcon />
          </button>
        </div>
      </fieldset>
    </div>
  );
}
