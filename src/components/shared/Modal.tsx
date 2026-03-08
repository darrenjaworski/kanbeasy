import { createPortal } from "react-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";
import { tc } from "../../theme/classNames";
import { ModalHeader } from "./ModalHeader";

type ModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  title?: string;
  "aria-labelledby"?: string;
  children: ReactNode;
  className?: string;
}>;

/**
 * Accessible modal dialog. Handles Escape key, backdrop click, and focus trap.
 *
 * When `icon` and `title` are provided, renders a standard ModalHeader
 * automatically and derives `aria-labelledby` from the title.
 *
 * @example
 * <Modal open={open} onClose={closeFn} icon={SettingsGearIcon} title="Settings">
 *   <p>Content</p>
 * </Modal>
 */
export function Modal({
  open,
  onClose,
  icon,
  title,
  children,
  "aria-labelledby": ariaLabelledby,
  className = "",
}: ModalProps) {
  const titleId =
    ariaLabelledby ??
    (title ? `${title.toLowerCase().replace(/\s+/g, "-")}-title` : undefined);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  useEffect(() => {
    if (!open) return;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-xs"
        aria-label="Close modal"
        onClick={onClose}
        tabIndex={-1}
        data-testid="modal-backdrop"
      />
      <dialog
        open
        aria-modal="true"
        aria-labelledby={titleId}
        aria-label={titleId ? undefined : "Settings"}
        className={`relative z-10 w-full max-w-md max-h-[85vh] flex flex-col overflow-hidden rounded-lg border ${tc.border} bg-surface text-text p-0 shadow-xl ${className}`}
      >
        {icon && title && (
          <div className="p-4 pb-2 shrink-0">
            <ModalHeader
              icon={icon}
              title={title}
              titleId={titleId!}
              onClose={onClose}
            />
          </div>
        )}
        {icon && title ? (
          <div className="px-4 pb-4 pt-2 overflow-y-auto">{children}</div>
        ) : (
          children
        )}
      </dialog>
    </div>,
    document.body,
  );
}
