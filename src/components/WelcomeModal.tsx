import { useEffect, useState } from "react";
import { Modal } from "./shared/Modal";
import { BoardViewIcon } from "./icons";
import { tc } from "../theme/classNames";
import { STORAGE_KEYS } from "../constants/storage";
import { kvGet, kvSet } from "../utils/db";

export function WelcomeModal() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const hasSeenWelcome = kvGet<string | null>(
      STORAGE_KEYS.HAS_SEEN_WELCOME,
      null,
    );
    if (!hasSeenWelcome) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    kvSet(STORAGE_KEYS.HAS_SEEN_WELCOME, "true");
    setIsVisible(false);
  };

  return (
    <Modal
      open={isVisible}
      onClose={handleClose}
      icon={BoardViewIcon}
      title="Welcome to Kanbeasy"
    >
      <div className="mb-4 space-y-3 text-sm" data-testid="welcome-description">
        <p>
          Kanban is a visual way to manage work. You organize tasks into columns
          that represent stages — like "To Do," "In Progress," and "Done." As
          work moves forward, you move cards from one column to the next. It
          gives you a clear picture of where everything stands at a glance.
        </p>
        <p>
          To get started, add a column for each stage of your workflow, then
          create cards for your tasks. Drag and drop cards between columns as
          you make progress, or reorder them within a column to set priorities.
          Everything is saved automatically to your device.
        </p>
      </div>
      <button
        onClick={handleClose}
        className={`${tc.button} w-full rounded-md px-3 py-1.5`}
        data-testid="get-started-button"
      >
        Get started!
      </button>
    </Modal>
  );
}
