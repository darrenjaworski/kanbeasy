import { Modal } from "./Modal";
import { tc } from "../../theme/classNames";

type Props = Readonly<{
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
}>;

export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = "Delete",
  cancelLabel = "Cancel",
}: Props) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className={`text-sm ${tc.textMuted} mb-4`}>{message}</p>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onClose}
          className={`${tc.button} flex-1 rounded-md px-3 py-1.5`}
        >
          {cancelLabel}
        </button>
        <button
          type="button"
          onClick={onConfirm}
          className={`${tc.dangerButton} flex-1 rounded-md px-3 py-1.5`}
          data-testid="confirm-delete-button"
        >
          {confirmLabel}
        </button>
      </div>
    </Modal>
  );
}
