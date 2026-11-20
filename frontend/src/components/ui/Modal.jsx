import { X } from "lucide-react";
import { useEffect, useId, useRef } from "react";
import { cx } from "./cx";

/**
 * Modal: a dialog on top of the page, built on the native <dialog> element, which gives us
 * focus trapping, Escape to close and a backdrop for free.
 *
 * <Modal open={isOpen} onClose={() => setOpen(false)} title="Box breathing" footer={<Button>Done</Button>}>
 *   ...content...
 * </Modal>
 */
const SIZES = { md: "max-w-lg", lg: "max-w-4xl" }; // lg: for forms with a side preview

export default function Modal({ open, onClose, title, footer, children, className, size = "md" }) {
  const dialog = useRef(null);
  const titleId = useId();

  // Open/close the native dialog when `open` changes
  useEffect(() => {
    const el = dialog.current;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={dialog}
      aria-labelledby={titleId}
      onClose={onClose} // Escape key
      onClick={(e) => e.target === dialog.current && onClose()} // click on the backdrop
      className={cx(
        "m-auto max-h-[calc(100dvh-2rem)] w-[calc(100%-2rem)] overflow-y-auto rounded-xl bg-surface p-0 text-ink-700 shadow-lift backdrop:bg-ink-900/40",
        "open:animate-pop-in",
        SIZES[size],
        className,
      )}
    >
      <div className="p-6 md:p-8">
        <div className="mb-4 flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-h3">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="-m-2 rounded-pill p-2 text-ink-700 transition hover:bg-sand hover:text-ink-900">
            <X aria-hidden="true" className="size-5" />
          </button>
        </div>
        {children}
        {footer && <div className="mt-6 flex flex-wrap justify-end gap-3">{footer}</div>}
      </div>
    </dialog>
  );
}
