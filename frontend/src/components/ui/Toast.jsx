import { CircleAlert, CircleCheck, Info, X } from "lucide-react";
import { createContext, useCallback, useContext, useState } from "react";
import { cx } from "./cx";

/**
 * Toast: short message in the corner that disappears after a few seconds.
 *
 * 1. Wrap the app once:  <ToastProvider><App /></ToastProvider>
 * 2. Anywhere:           const toast = useToast();  toast("Saved!")  or  toast("Could not save", "error")
 *
 * The message area is an aria-live region, so screen readers announce new toasts.
 * Never put private text (chat, answers) in a toast.
 */
const ToastContext = createContext(null);
const DURATION_MS = 4000;
let nextId = 1; // simple counter for keys (crypto.randomUUID needs HTTPS)

const KINDS = {
  success: { icon: CircleCheck, color: "text-success" },
  error: { icon: CircleAlert, color: "text-danger" },
  info: { icon: Info, color: "text-ink-700" },
};

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const dismiss = useCallback((id) => setToasts((all) => all.filter((t) => t.id !== id)), []);

  const toast = useCallback(
    (message, kind = "success") => {
      const id = nextId++;
      setToasts((all) => [...all, { id, message, kind }]);
      setTimeout(() => dismiss(id), DURATION_MS);
    },
    [dismiss],
  );

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div aria-live="polite" className="fixed inset-x-4 bottom-4 z-50 flex flex-col items-center gap-2 sm:inset-x-auto sm:right-6 sm:items-end">
        {toasts.map((t) => {
          const { icon: Icon, color } = KINDS[t.kind];
          return (
            <div key={t.id} className="flex w-full max-w-sm animate-pop-in items-center gap-3 rounded-md bg-surface px-4 py-3 shadow-lift ring-1 ring-line">
              <Icon aria-hidden="true" className={cx("size-5 shrink-0", color)} />
              <p className="flex-1 text-small font-semibold text-ink-900">{t.message}</p>
              <button type="button" onClick={() => dismiss(t.id)} aria-label="Dismiss" className="rounded-pill p-1 text-ink-700 hover:bg-sand">
                <X aria-hidden="true" className="size-4" />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const toast = useContext(ToastContext);
  if (!toast) throw new Error("useToast must be used inside <ToastProvider>");
  return toast;
}
