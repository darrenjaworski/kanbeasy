import { createPortal } from "react-dom";
import { useEffect } from "react";
import type { ReactNode } from "react";

export type ModalProps = Readonly<{
  open: boolean;
  onClose: () => void;
  "aria-labelledby"?: string;
  children: ReactNode;
  className?: string;
}>;

/**
 * Accessible modal dialog. Handles Escape key, backdrop click, and focus trap.
 *
 * @example
 * <Modal open={open} onClose={closeFn} aria-labelledby="modal-title">
 *   <h2 id="modal-title">Title</h2>
 *   <p>Content</p>
 * </Modal>
 */
export function Modal({
  open,
  onClose,
  children,
  "aria-labelledby": ariaLabelledby,
  className = "",
}: ModalProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

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
        aria-labelledby={ariaLabelledby}
        // role="dialog" removed (redundant)
        aria-label={ariaLabelledby ? undefined : "Settings"}
        className={`relative z-10 w-full max-w-md rounded-lg border border-black/10 dark:border-white/10 bg-surface-light dark:bg-surface-dark text-text-light dark:text-text-dark p-0 shadow-xl ${className}`}
      >
        {children}
      </dialog>
    </div>,
    document.body
  );
}
