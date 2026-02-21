import { createPortal } from "react-dom";
import { CloseIcon } from "./icons/CloseIcon";
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
          <p className="mb-4" data-testid="welcome-description">
            Kanban is a simple and effective way to organize tasks. Drag and
            drop cards between columns to track progress. Customize your
            workflow to suit your needs.
          </p>
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
    document.body
  );
}
