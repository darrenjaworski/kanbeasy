import { Modal } from "../shared/Modal";
import { SettingsGearIcon } from "../icons";
import { tc } from "../../theme/classNames";
import { ThemeSection } from "./ThemeSection";
import { CardTypeSection } from "./CardTypeSection";
import { BoardSettingsSection } from "./BoardSettingsSection";
import { DataSection } from "./DataSection";
import { SettingsSection } from "./SettingsSection";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function SettingsModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <Modal
      open={open}
      onClose={onClose}
      icon={SettingsGearIcon}
      title="Settings"
    >
      <SettingsSection title="Appearance">
        <ThemeSection />
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
          kanbeasy v{__APP_VERSION__}
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
    </Modal>
  );
}
