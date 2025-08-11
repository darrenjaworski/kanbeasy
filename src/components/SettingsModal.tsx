import { Modal } from "./Modal";

import { useTheme } from "../theme/useTheme";
import { DensitySmallIcon } from "./icons/DensitySmallIcon";
import { DensityMediumIcon } from "./icons/DensityMediumIcon";
import { DensityLargeIcon } from "./icons/DensityLargeIcon";
import { SettingsGearIcon } from "./icons/SettingsGearIcon";
import { CloseIcon } from "./icons/CloseIcon";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function SettingsModal({ open, onClose }: Props) {
  const { theme, setTheme, cardDensity, setCardDensity } = useTheme();

  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="settings-title">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <SettingsGearIcon className="size-5 text-black/70 dark:text-white/70" />
          <h2
            id="settings-title"
            className="text-base font-semibold tracking-tight"
          >
            Settings
          </h2>
          <button
            type="button"
            className="ml-auto h-6 w-6 inline-flex items-center justify-center rounded-full hover:bg-black/10 dark:hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white"
            onClick={onClose}
            aria-label="Close settings"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
        <div className="space-y-4">
          <label className="flex items-center justify-between gap-3 text-sm font-medium cursor-pointer select-none">
            <span>Dark mode</span>
            <span className="relative inline-flex items-center">
              <input
                id="dark-mode"
                type="checkbox"
                role="switch"
                checked={theme === "dark"}
                onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
                className="sr-only peer"
              />
              <span className="block h-6 w-10 rounded-full bg-black/10 dark:bg-white/15 peer-checked:bg-indigo-500 transition-colors relative" />
              <span
                aria-hidden
                className="absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform peer-checked:translate-x-4"
              />
            </span>
          </label>
          <fieldset className="flex items-center justify-between gap-3 text-sm font-medium border-0 p-0 m-0">
            <legend className="sr-only">Card density</legend>
            <span aria-hidden>Card density</span>
            <div className="inline-flex items-center overflow-hidden rounded-full border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20">
              <button
                type="button"
                onClick={() => setCardDensity("small")}
                title="Compact"
                aria-pressed={cardDensity === "small"}
                className={`h-9 w-9 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/10 ${
                  cardDensity === "small" ? "bg-black/10 dark:bg-white/10" : ""
                }`}
              >
                <DensitySmallIcon />
              </button>
              <span
                aria-hidden
                className="h-7 w-px bg-black/10 dark:bg-white/10"
              />
              <button
                type="button"
                onClick={() => setCardDensity("medium")}
                title="Comfortable"
                aria-pressed={cardDensity === "medium"}
                className={`h-9 w-9 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/10 ${
                  cardDensity === "medium" ? "bg-black/10 dark:bg-white/10" : ""
                }`}
              >
                <DensityMediumIcon />
              </button>
              <span
                aria-hidden
                className="h-7 w-px bg-black/10 dark:bg-white/10"
              />
              <button
                type="button"
                onClick={() => setCardDensity("large")}
                title="Spacious"
                aria-pressed={cardDensity === "large"}
                className={`h-9 w-9 inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 text-black/80 dark:text-white/80 hover:bg-black/10 dark:hover:bg-white/10 ${
                  cardDensity === "large" ? "bg-black/10 dark:bg-white/10" : ""
                }`}
              >
                <DensityLargeIcon />
              </button>
            </div>
          </fieldset>
        </div>
        <div className="mt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 px-3 py-1.5 text-sm hover:bg-black/10 dark:hover:bg-white/10 transition-colors text-black/80 dark:text-white/80 hover:text-black dark:hover:text-white"
          >
            Save
          </button>
        </div>
      </div>
    </Modal>
  );
}
