import { tc } from "../theme/classNames";

export function Footer() {
  return (
    <footer
      className={`fixed inset-x-0 bottom-0 z-10 border-t ${tc.borderSubtle} bg-surface/80 backdrop-blur supports-[backdrop-filter]:bg-surface/60`}
    >
      <div
        className={`mx-auto max-w-6xl px-3 py-2 text-xs ${tc.textMuted} text-center`}
      >
        <p>
          Developed with ❤️ by{" "}
          <a
            href="https://github.com/darrenjaworski"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-black/90 dark:hover:text-white/90"
          >
            darrenjaworski
          </a>
          , Copilot, and Claude.
        </p>
      </div>
    </footer>
  );
}
