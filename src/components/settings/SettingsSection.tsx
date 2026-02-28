import { useCallback, useState } from "react";
import { tc } from "../../theme/classNames";
import { STORAGE_KEYS } from "../../constants/storage";

type Props = Readonly<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}>;

function getSectionKey(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-");
}

function readSavedState(key: string, fallback: boolean): boolean {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS_SECTIONS);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Record<string, boolean>;
    return typeof parsed[key] === "boolean" ? parsed[key] : fallback;
  } catch {
    return fallback;
  }
}

function writeSavedState(key: string, value: boolean): void {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.SETTINGS_SECTIONS);
    const existing = raw ? (JSON.parse(raw) as Record<string, boolean>) : {};
    existing[key] = value;
    localStorage.setItem(
      STORAGE_KEYS.SETTINGS_SECTIONS,
      JSON.stringify(existing),
    );
  } catch {
    // Ignore storage failures
  }
}

export function SettingsSection({
  title,
  defaultOpen = false,
  children,
}: Props) {
  const sectionKey = getSectionKey(title);
  const [open, setOpen] = useState(() =>
    readSavedState(sectionKey, defaultOpen),
  );

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      writeSavedState(sectionKey, next);
      return next;
    });
  }, [sectionKey]);

  return (
    <div
      className={`border-b ${tc.borderSubtle} last:border-b-0`}
      data-testid={`settings-section-${sectionKey}`}
    >
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        className={`w-full flex items-center justify-between py-3 text-base font-bold tracking-tight ${tc.text} ${tc.focusRing} transition-colors`}
      >
        {title}
        <svg
          className={`size-4 ${tc.textFaint} transition-transform ${open ? "rotate-180" : ""}`}
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden
        >
          <path
            fillRule="evenodd"
            d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z"
            clipRule="evenodd"
          />
        </svg>
      </button>
      {open && <div className="pb-4">{children}</div>}
    </div>
  );
}
