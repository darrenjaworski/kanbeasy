import { useState, useCallback } from "react";
import { tc } from "../../theme/classNames";
import { kvGet, kvSet } from "../../utils/db";
import { STORAGE_KEYS } from "../../constants/storage";

type Props = Readonly<{
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}>;

function getSectionKey(title: string): string {
  return title.toLowerCase().replace(/\s+/g, "-");
}

function getSectionStates(): Record<string, boolean> {
  return kvGet<Record<string, boolean>>(STORAGE_KEYS.SETTINGS_SECTIONS, {});
}

export function SettingsSection({
  title,
  defaultOpen = false,
  children,
}: Props) {
  const sectionKey = getSectionKey(title);
  const [open, setOpen] = useState(() => {
    const states = getSectionStates();
    return sectionKey in states ? states[sectionKey] : defaultOpen;
  });

  const toggle = useCallback(() => {
    setOpen((prev) => {
      const next = !prev;
      const states = getSectionStates();
      kvSet(STORAGE_KEYS.SETTINGS_SECTIONS, { ...states, [sectionKey]: next });
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
