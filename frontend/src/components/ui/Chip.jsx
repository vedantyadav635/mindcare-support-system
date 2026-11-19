import { Check } from "lucide-react";
import { cx } from "./cx";

/**
 * Chip: small pill.
 *   - With onClick it is a toggle button (selectable filter): <Chip selected={on} onClick={toggle}>Sleep</Chip>
 *   - Without onClick it is a plain tag: <Chip>stress</Chip>
 */
export default function Chip({ selected = false, onClick, icon: Icon, className, children }) {
  const look = cx(
    "inline-flex min-h-9 items-center gap-1.5 rounded-pill px-4 text-small font-semibold transition",
    selected ? "bg-ink-900 text-white" : "bg-surface text-ink-900 ring-2 ring-line",
    className,
  );

  if (!onClick) {
    return <span className={look}>{Icon && <Icon aria-hidden="true" className="size-4" />}{children}</span>;
  }
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={cx(look, !selected && "hover:ring-ink-500")}>
      {selected ? <Check aria-hidden="true" className="size-4" /> : Icon && <Icon aria-hidden="true" className="size-4" />}
      {children}
    </button>
  );
}
