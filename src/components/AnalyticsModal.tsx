import { Modal } from "./Modal";
import { AnalyticsIcon } from "./icons/AnalyticsIcon";
import { CloseIcon } from "./icons/CloseIcon";
import { tc } from "../theme/classNames";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
}>;

export function AnalyticsModal({ open, onClose }: Props) {
  if (!open) return null;

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="analytics-title">
      <div className="p-4">
        <div className="flex items-center gap-3 mb-3">
          <AnalyticsIcon className={`size-5 ${tc.textMuted}`} />
          <h2
            id="analytics-title"
            className="text-base font-semibold tracking-tight"
          >
            Analytics
          </h2>
          <button
            type="button"
            className={`ml-auto ${tc.iconButton} h-6 w-6 rounded-full`}
            onClick={onClose}
            aria-label="Close analytics"
          >
            <CloseIcon className="size-4" />
          </button>
        </div>
        <p className={`text-sm ${tc.textMuted}`}>Analytics coming soon.</p>
      </div>
    </Modal>
  );
}
