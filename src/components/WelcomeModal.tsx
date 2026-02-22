import { createPortal } from "react-dom";
import { CloseIcon } from "./icons";
import { useEffect, useState } from "react";
import { tc } from "../theme/classNames";

export function WelcomeModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem("hasSeenWelcome");
    if (!hasSeenWelcome) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    localStorage.setItem("hasSeenWelcome", "true");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        aria-label="Close welcome modal"
        onClick={handleClose}
      />
      <dialog
        open
        aria-labelledby="welcome-title"
        className={`relative z-10 w-full max-w-md rounded-lg border ${tc.border} bg-surface text-text p-0 shadow-xl`}
      >
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <h2
              id="welcome-title"
              className="text-base font-semibold tracking-tight"
            >
              Welcome to Kanbeasy
            </h2>
            <button
              type="button"
              className={`ml-auto ${tc.iconButton} h-6 w-6 rounded-full`}
              onClick={handleClose}
              aria-label="Close welcome modal"
            >
              <CloseIcon className="size-4" />
            </button>
          </div>
          <div
            className="mb-4 space-y-3 text-sm"
            data-testid="welcome-description"
          >
            <p>
              Kanban is a visual way to manage work. You organize tasks into
              columns that represent stages — like "To Do," "In Progress," and
              "Done." As work moves forward, you move cards from one column to
              the next. It gives you a clear picture of where everything stands
              at a glance.
            </p>
            <p>
              To get started, add a column for each stage of your workflow, then
              create cards for your tasks. Drag and drop cards between columns
              as you make progress, or reorder them within a column to set
              priorities. Everything is saved automatically to your device.
            </p>
          </div>
          <button
            onClick={handleClose}
            className={`${tc.button} w-full rounded-md px-3 py-1.5`}
            data-testid="get-started-button"
          >
            Get started!
          </button>
        </div>
      </dialog>
    </div>,
    document.body,
  );
}
