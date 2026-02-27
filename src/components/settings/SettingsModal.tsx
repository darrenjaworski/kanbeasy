import { Modal } from "../shared/Modal";
import { SettingsGearIcon } from "../icons";
import { tc } from "../../theme/classNames";
import { ModalHeader } from "../shared/ModalHeader";
import { ThemeSection } from "./ThemeSection";
import { TicketTypeSection } from "./TicketTypeSection";
import { BoardSettingsSection } from "./BoardSettingsSection";
import { DataSection } from "./DataSection";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function SettingsModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="settings-title">
      <div className="p-4 pb-2 shrink-0">
        <ModalHeader
          icon={SettingsGearIcon}
          title="Settings"
          titleId="settings-title"
          onClose={onClose}
        />
      </div>

      <div className="p-4 pt-3 overflow-y-auto">
        <ThemeSection />
        <TicketTypeSection />
        <BoardSettingsSection />
        <DataSection />

        {/* Version */}
        <div className={`mt-4 text-center text-xs ${tc.textFaint}`}>
          <a
            href="https://github.com/darrenjaworski/kanbeasy"
            target="_blank"
            rel="noopener noreferrer"
            className={`${tc.textHover} transition-colors`}
          >
            kanbeasy v{__APP_VERSION__}
          </a>
        </div>
      </div>
    </Modal>
  );
}
