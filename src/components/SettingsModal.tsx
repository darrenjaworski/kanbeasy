import { createPortal } from "react-dom";
import { useEffect } from "react";
import { useTheme } from "../theme/useTheme";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

// Inline SVG components for density icons to inherit currentColor
const DensitySmallIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="20"
    viewBox="0 -960 960 960"
    width="20"
    fill="currentColor"
    aria-hidden
    focusable="false"
  >
    <path d="M120-80v-80h720v80H120Zm0-240v-80h720v80H120Zm0-240v-80h720v80H120Zm0-240v-80h720v80H120Z" />
  </svg>
);

const DensityMediumIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="20"
    viewBox="0 -960 960 960"
    width="20"
    fill="currentColor"
    aria-hidden
    focusable="false"
  >
    <path d="M120-120v-80h720v80H120Zm0-320v-80h720v80H120Zm0-320v-80h720v80H120Z" />
  </svg>
);

const DensityLargeIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    height="20"
    viewBox="0 -960 960 960"
    width="20"
    fill="currentColor"
    aria-hidden
    focusable="false"
  >
    <path d="M120-120v-80h720v80H120Zm0-640v-80h720v80H120Z" />
  </svg>
);

export function SettingsModal({ open, onClose }: Props) {
  const { theme, setTheme, cardDensity, setCardDensity } = useTheme();

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
        className="absolute inset-0 bg-black/40 backdrop-blur-sm"
        aria-label="Close settings"
        onClick={onClose}
      />
      <dialog
        open
        aria-labelledby="settings-title"
        className="relative z-10 w-full max-w-md rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark p-0 shadow-xl"
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 -960 960 960"
              className="size-5 text-black/70 dark:text-white/70"
              fill="currentColor"
              aria-hidden
              focusable="false"
            >
              <path d="m370-80-16-128q-13-5-24.5-12T307-235l-119 50L78-375l103-78q-1-7-1-13.5v-27q0-6.5 1-13.5L78-585l110-190 119 50q11-8 23-15t24-12l16-128h220l16 128q13 5 24.5 12t22.5 15l119-50 110 190-103 78q1 7 1 13.5v27q0 6.5-2 13.5l103 78-110 190-118-50q-11 8-23 15t-24 12L590-80H370Zm70-80h79l14-106q31-8 57.5-23.5T639-327l99 41 39-68-86-65q5-14 7-29.5t2-31.5q0-16-2-31.5t-7-29.5l86-65-39-68-99 42q-22-23-48.5-38.5T533-694l-13-106h-79l-14 106q-31 8-57.5 23.5T321-633l-99-41-39 68 86 64q-5 15-7 30t-2 32q0 16 2 31t7 30l-86 65 39 68 99-42q22 23 48.5 38.5T427-266l13 106Zm42-180q58 0 99-41t41-99q0-58-41-99t-99-41q-59 0-99.5 41T342-480q0 58 40.5 99t99.5 41Zm-2-140Z" />
            </svg>
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
              <svg
                xmlns="http://www.w3.org/2000/svg"
                viewBox="0 -960 960 960"
                className="size-4"
                fill="currentColor"
                aria-hidden
                focusable="false"
              >
                <path d="m256-200-56-56 224-224-224-224 56-56 224 224 224-224 56 56-224 224 224 224-56 56-224-224-224 224Z" />
              </svg>
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
                  onChange={(e) =>
                    setTheme(e.target.checked ? "dark" : "light")
                  }
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
                    cardDensity === "small"
                      ? "bg-black/10 dark:bg-white/10"
                      : ""
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
                    cardDensity === "medium"
                      ? "bg-black/10 dark:bg-white/10"
                      : ""
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
                    cardDensity === "large"
                      ? "bg-black/10 dark:bg-white/10"
                      : ""
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
      </dialog>
    </div>,
    document.body
  );
}

// icon provided inline via SVG
