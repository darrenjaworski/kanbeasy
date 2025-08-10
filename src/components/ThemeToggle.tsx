import { useTheme } from "../theme/useTheme";

export function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      type="button"
      className="inline-flex items-center gap-2 rounded-md border border-black/10 dark:border-white/10 bg-white/60 dark:bg-black/20 px-3 py-1.5 text-sm hover:bg-white/80 dark:hover:bg-black/30 transition-colors"
      onClick={toggle}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      <span className="font-medium">{theme === "dark" ? "Dark" : "Light"}</span>
    </button>
  );
}
