import { Modal } from "./Modal";

import { useTheme } from "../theme/useTheme";
import { useBoard } from "../board/useBoard";
import { themes } from "../theme/themes";
import type { ThemePreference } from "../theme/types";
import { DensitySmallIcon } from "./icons/DensitySmallIcon";
import { DensityMediumIcon } from "./icons/DensityMediumIcon";
import { DensityLargeIcon } from "./icons/DensityLargeIcon";
import { SettingsGearIcon } from "./icons/SettingsGearIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { tc } from "../theme/classNames";
import { exportBoard } from "../utils/exportBoard";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

const lightThemes = themes.filter((t) => t.mode === "light");
const darkThemes = themes.filter((t) => t.mode === "dark");

function themesForMode(mode: "light" | "dark") {
  return mode === "light" ? lightThemes : darkThemes;
}

export function SettingsModal({ open, onClose }: Props) {
  const {
    themeId,
    setThemeId,
    themeMode,
    themePreference,
    setThemePreference,
    cardDensity,
    setCardDensity,
    columnResizingEnabled,
    setColumnResizingEnabled,
    deleteColumnWarningEnabled,
    setDeleteColumnWarningEnabled,
  } = useTheme();
  const { resetBoard } = useBoard();

  const handleClearLocalStorage = () => {
    window.localStorage.clear();
    resetBoard();
  };

  const handleModeSwitch = (pref: ThemePreference) => {
    if (pref === themePreference) return;
    setThemePreference(pref);
  };

  if (!open) return null;

  const visibleThemes = themesForMode(themeMode);

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="settings-title">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <SettingsGearIcon className={`size-5 ${tc.textMuted}`} />
          <h2
            id="settings-title"
            className="text-base font-semibold tracking-tight"
          >
            Settings
          </h2>
          <button
            type="button"
            className={`ml-auto ${tc.iconButton} h-6 w-6 rounded-full`}
            onClick={onClose}
            aria-label="Close settings"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
        {/* Theme */}
        <fieldset className="border-0 p-0 m-0 mb-4 space-y-3 text-sm font-medium">
          <legend className="sr-only">Theme</legend>
          <span aria-hidden>Theme</span>
          <div className={`${tc.buttonGroup} rounded-full w-full mt-1`}>
            <button
              type="button"
              onClick={() => handleModeSwitch("light")}
              aria-pressed={themePreference === "light"}
              className={`flex-1 px-3 py-1.5 text-sm text-center transition-colors ${tc.focusRing} ${
                themePreference === "light"
                  ? `${tc.pressed} ${tc.text}`
                  : `${tc.textFaint} ${tc.textHover}`
              }`}
            >
              Light
            </button>
            <span aria-hidden className={`${tc.separator} h-7 w-px`} />
            <button
              type="button"
              onClick={() => handleModeSwitch("system")}
              aria-pressed={themePreference === "system"}
              className={`flex-1 px-3 py-1.5 text-sm text-center transition-colors ${tc.focusRing} ${
                themePreference === "system"
                  ? `${tc.pressed} ${tc.text}`
                  : `${tc.textFaint} ${tc.textHover}`
              }`}
            >
              System
            </button>
            <span aria-hidden className={`${tc.separator} h-7 w-px`} />
            <button
              type="button"
              onClick={() => handleModeSwitch("dark")}
              aria-pressed={themePreference === "dark"}
              className={`flex-1 px-3 py-1.5 text-sm text-center transition-colors ${tc.focusRing} ${
                themePreference === "dark"
                  ? `${tc.pressed} ${tc.text}`
                  : `${tc.textFaint} ${tc.textHover}`
              }`}
            >
              Dark
            </button>
          </div>
          <div className="flex gap-2">
            {visibleThemes.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setThemeId(t.id)}
                aria-pressed={themeId === t.id}
                aria-label={`${t.name} theme`}
                className={`flex-1 rounded-lg border-2 py-3 text-xs font-medium transition-all ${tc.focusRing} focus-visible:ring-offset-2 ${
                  themeId === t.id
                    ? "border-accent ring-2 ring-accent/30"
                    : `${tc.border} hover:border-black/20 dark:hover:border-white/20`
                }`}
                style={{ backgroundColor: t.colors.bg, color: t.colors.text }}
              >
                <div className="flex flex-col items-center gap-1.5">
                  <span
                    className="h-4 w-4 rounded-full"
                    style={{ backgroundColor: t.colors.accent }}
                  />
                  <span>{t.name}</span>
                </div>
              </button>
            ))}
          </div>
        </fieldset>


        {/* Board settings */}
        <div className="space-y-3 text-sm font-medium mb-4">
          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <span>Column resizing</span>
            <span className="relative inline-flex items-center">
              <input
                id="column-resizing"
                type="checkbox"
                role="switch"
                checked={columnResizingEnabled}
                onChange={(e) => setColumnResizingEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <span className="block h-6 w-10 rounded-full bg-black/10 dark:bg-white/15 peer-checked:bg-accent transition-colors relative" />
              <span
                aria-hidden
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform peer-checked:translate-x-4"
              />
            </span>
          </label>
          <label className="flex items-center justify-between gap-3 cursor-pointer select-none">
            <span>Warn before deleting columns with cards</span>
            <span className="relative inline-flex items-center">
              <input
                id="delete-column-warning"
                type="checkbox"
                role="switch"
                checked={deleteColumnWarningEnabled}
                onChange={(e) => setDeleteColumnWarningEnabled(e.target.checked)}
                className="sr-only peer"
              />
              <span className="block h-6 w-10 rounded-full bg-black/10 dark:bg-white/15 peer-checked:bg-accent transition-colors relative" />
              <span
                aria-hidden
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-xs transition-transform peer-checked:translate-x-4"
              />
            </span>
          </label>
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


        {/* Actions */}
        <div className="space-y-2">
          <button
            type="button"
            onClick={exportBoard}
            className={`${tc.button} w-full rounded-md px-3 py-1.5`}
          >
            Export board data
          </button>
          <button
            type="button"
            onClick={handleClearLocalStorage}
            className={`${tc.dangerButton} w-full rounded-md px-3 py-1.5`}
          >
            Clear board data
          </button>
          <button
            type="button"
            onClick={onClose}
            className={`${tc.button} w-full rounded-md px-3 py-1.5`}
          >
            Close
          </button>
        </div>

        {/* Version */}
        <div className={`mt-4 text-center text-xs ${tc.textFaint}`}>
          <a
            href="https://github.com/darrenjaworski/kanbeasy"
            target="_blank"
            rel="noopener noreferrer"
            className={`${tc.textHover} transition-colors`}
          >
            kanbeasy v{__APP_VERSION__}
          </a>
        </div>
      </div>
    </Modal>
  );
}
