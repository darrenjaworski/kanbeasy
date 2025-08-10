import { ThemeToggle } from "./ThemeToggle";

export function Header() {
  return (
    <header className="sticky top-0 z-10 border-b border-black/5 dark:border-white/10 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur supports-[backdrop-filter]:bg-surface-light/60 supports-[backdrop-filter]:dark:bg-surface-dark/60">
      <div className="mx-auto max-w-6xl px-4 py-3 flex items-center gap-3">
        <h1 className="text-lg font-semibold tracking-tight">Kanbeasy</h1>
        <div className="ml-auto">
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
