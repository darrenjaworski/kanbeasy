export function Footer() {
  return (
    <footer className="fixed inset-x-0 bottom-0 z-10 border-t border-black/5 dark:border-white/10 bg-surface-light/80 dark:bg-surface-dark/80 backdrop-blur supports-[backdrop-filter]:bg-surface-light/60 supports-[backdrop-filter]:dark:bg-surface-dark/60">
      <div className="mx-auto max-w-6xl px-3 py-2 text-xs text-black/70 dark:text-white/70 text-center">
        <p>
          Developed with ❤️ by{" "}
          <a
            href="https://github.com/darrenjaworski"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-black/90 dark:hover:text-white/90"
          >
            darrenjaworski
          </a>{" "}
          and Copilot.
        </p>
      </div>
    </footer>
  );
}
