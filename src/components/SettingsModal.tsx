import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useTheme } from "../theme/useTheme";

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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="settings-title"
      onMouseDown={(e) => {
        if (e.currentTarget === e.target) onClose();
      }}
    >
      <div className="absolute inset-0 bg-black/40" />
      <div className="relative z-10 w-full max-w-md rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark p-4 shadow-xl">
        <div className="flex items-center gap-3 mb-3">
          <GearIcon className="size-5 opacity-70" />
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
    </div>,
    document.body
  );
}

function GearIcon({ className = "" }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="currentColor"
      className={className}
      aria-hidden
    >
      <path d="M11.983 8.25a3.75 3.75 0 1 0 0 7.5 3.75 3.75 0 0 0 0-7.5Z" />
      <path
        fillRule="evenodd"
        d="M10.362 2.504a1.5 1.5 0 0 1 3.276 0l.23 1.383c.117.7.683 1.246 1.387 1.34l1.397.187a1.5 1.5 0 0 1 .978 2.464l-.94 1.037a1.5 1.5 0 0 0 0 2.006l.94 1.037a1.5 1.5 0 0 1-.978 2.464l-1.397.187a1.5 1.5 0 0 0-1.387 1.34l-.23 1.383a1.5 1.5 0 0 1-3.276 0l-.23-1.383a1.5 1.5 0 0 0-1.387-1.34l-1.397-.187a1.5 1.5 0 0 1-.978-2.464l.94-1.037a1.5 1.5 0 0 0 0-2.006l-.94-1.037a1.5 1.5 0 0 1 .978-2.464l1.397-.187a1.5 1.5 0 0 0 1.387-1.34l.23-1.383Z"
        clipRule="evenodd"
      />
    </svg>
  );
}
