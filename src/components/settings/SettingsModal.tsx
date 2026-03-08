import { useState } from "react";
import { Modal } from "../shared/Modal";
import { SettingsGearIcon } from "../icons";
import { tc } from "../../theme/classNames";
import { ThemeSection } from "./ThemeSection";
import { CardTypeSection } from "./CardTypeSection";
import { BoardSettingsSection } from "./BoardSettingsSection";
import { DataSection } from "./DataSection";
import { SettingsSection } from "./SettingsSection";
import { CardLayoutSection } from "./CardLayoutSection";

type SettingsView = "settings" | "cardLayout";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function SettingsModal({ open, onClose }: Props) {
  const [view, setView] = useState<SettingsView>("settings");

  if (!open) return null;

  const handleClose = () => {
    setView("settings");
    onClose();
  };

  const title = view === "cardLayout" ? "Card Layout Editor" : "Settings";

  return (
    <Modal
      open={open}
      onClose={handleClose}
      icon={SettingsGearIcon}
      title={title}
    >
      {view === "cardLayout" ? (
        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setView("settings")}
            className={`flex items-center gap-1 text-sm ${tc.textFaint} ${tc.textHover} ${tc.focusRing} transition-colors`}
            aria-label="Back to Settings"
          >
            <svg
              className="size-4"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
              aria-hidden
            >
              <path
                fillRule="evenodd"
                d="M12.79 5.23a.75.75 0 01-.02 1.06L8.832 10l3.938 3.71a.75.75 0 11-1.04 1.08l-4.5-4.25a.75.75 0 010-1.08l4.5-4.25a.75.75 0 011.06.02z"
                clipRule="evenodd"
              />
            </svg>
            Back to Settings
          </button>
          <CardLayoutSection />
        </div>
      ) : (
        <>
          <SettingsSection title="Appearance">
            <ThemeSection onOpenCardLayout={() => setView("cardLayout")} />
          </SettingsSection>
          <SettingsSection title="Card Types">
            <CardTypeSection />
          </SettingsSection>
          <SettingsSection title="Preferences">
            <BoardSettingsSection />
          </SettingsSection>
          <SettingsSection title="Data">
            <DataSection />
          </SettingsSection>

          {/* Version & credit */}
          <div className={`mt-4 text-center text-xs ${tc.textFaint} space-y-1`}>
            <a
              href="https://github.com/darrenjaworski/kanbeasy"
              target="_blank"
              rel="noopener noreferrer"
              className={`${tc.textHover} transition-colors`}
            >
              Kanbeasy v{__APP_VERSION__}
            </a>
            <p>
              Made with ❤️ by{" "}
              <a
                href="https://github.com/darrenjaworski"
                target="_blank"
                rel="noopener noreferrer"
                className={`underline underline-offset-2 ${tc.textHover} transition-colors`}
              >
                darrenjaworski
              </a>
              , Copilot, and Claude.
            </p>
          </div>
        </>
      )}
    </Modal>
  );
}
