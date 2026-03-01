import { useTheme } from "../../theme/useTheme";
import { themes } from "../../theme/themes";
import type { ThemePreference } from "../../theme/types";
import { tc } from "../../theme/classNames";
import {
  DensitySmallIcon,
  DensityMediumIcon,
  DensityLargeIcon,
} from "../icons";

const lightThemes = themes.filter((t) => t.mode === "light");
const darkThemes = themes.filter((t) => t.mode === "dark");

function themesForMode(mode: "light" | "dark") {
  return mode === "light" ? lightThemes : darkThemes;
}

const MODE_OPTIONS: { value: ThemePreference; label: string }[] = [
  { value: "light", label: "Light" },
  { value: "system", label: "System" },
  { value: "dark", label: "Dark" },
];

export function ThemeSection() {
  const {
    themeId,
    setThemeId,
    themeMode,
    themePreference,
    setThemePreference,
    cardDensity,
    setCardDensity,
  } = useTheme();

  const handleModeSwitch = (pref: ThemePreference) => {
    if (pref === themePreference) return;
    setThemePreference(pref);
  };

  const visibleThemes = themesForMode(themeMode);

  return (
    <fieldset className="border-0 p-0 m-0 space-y-3 text-sm font-medium">
      <legend className="sr-only">Theme</legend>
      <div className={`${tc.buttonGroup} rounded-full w-full mt-1`}>
        {MODE_OPTIONS.map((opt, i) => (
          <span key={opt.value} className="contents">
            {i > 0 && (
              <span aria-hidden className={`${tc.separator} h-7 w-px`} />
            )}
            <button
              type="button"
              onClick={() => handleModeSwitch(opt.value)}
              aria-pressed={themePreference === opt.value}
              className={`flex-1 px-3 py-1.5 text-sm text-center transition-colors ${tc.focusRing} ${
                themePreference === opt.value
                  ? `${tc.pressed} ${tc.text}`
                  : `${tc.textFaint} ${tc.textHover}`
              }`}
            >
              {opt.label}
            </button>
          </span>
        ))}
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
                : `${tc.border} ${tc.borderHover}`
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
      <fieldset className="flex items-center justify-between gap-3 border-0 p-0 m-0">
        <legend className="sr-only">Card density</legend>
        <span aria-hidden>Card density</span>
        <div className={`${tc.buttonGroup} rounded-full`}>
          <button
            type="button"
            onClick={() => setCardDensity("small")}
            aria-label="Compact"
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
            aria-label="Comfortable"
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
            aria-label="Spacious"
            aria-pressed={cardDensity === "large"}
            className={`h-9 w-9 ${tc.iconButton} ${
              cardDensity === "large" ? tc.pressed : ""
            }`}
          >
            <DensityLargeIcon />
          </button>
        </div>
      </fieldset>
    </fieldset>
  );
}
