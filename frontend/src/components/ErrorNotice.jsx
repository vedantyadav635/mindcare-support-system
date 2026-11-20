import { CircleAlert } from "lucide-react";

/** ErrorNotice: a visible, announced error box for backend errors (renders nothing when there is no message). */
export default function ErrorNotice({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="flex items-start gap-2 rounded-md border-2 border-danger/40 bg-danger/10 px-4 py-3 text-small font-semibold text-ink-900">
      <CircleAlert aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-danger" />
      <span>{children}</span>
    </p>
  );
}
