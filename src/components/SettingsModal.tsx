import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useTheme } from "../theme/useTheme";
import settingsIconUrl from "../icons/settings.svg";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function SettingsModal({ open, onClose }: Props) {
  const { theme, setTheme } = useTheme();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40"
        aria-label="Close settings"
        onClick={onClose}
      />
      <dialog open className="relative z-10 w-full max-w-md rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark p-0 shadow-xl">
        <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <img src={settingsIconUrl} alt="" aria-hidden className="size-5 opacity-70" />
          <h2 id="settings-title" className="text-base font-semibold tracking-tight">
            Settings
          </h2>
          <button
            type="button"
            className="ml-auto rounded-md px-2 py-1 text-sm opacity-70 hover:opacity-100"
            onClick={onClose}
            aria-label="Close settings"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <label htmlFor="dark-mode" className="text-sm font-medium">
              Dark mode
            </label>
            <input
              id="dark-mode"
              type="checkbox"
              role="switch"
              aria-label="Dark mode"
              checked={theme === "dark"}
              onChange={(e) => setTheme(e.target.checked ? "dark" : "light")}
              className="size-5 accent-indigo-500"
            />
          </div>
        </div>
        </div>
      </dialog>
    </div>,
    document.body
  );
}

// icon now provided by imported SVG
