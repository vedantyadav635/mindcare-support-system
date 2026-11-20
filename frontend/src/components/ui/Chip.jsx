import { Check } from "lucide-react";
import { cx } from "./cx";

/**
 * Chip: pill-shaped label.
 *   - With onClick it is a toggle button (selectable filter): <Chip selected={on} onClick={toggle}>Sleep</Chip>
 *   - With `as` it is a link or other element:                <Chip as={Link} to="/register" icon={Moon}>Sleep</Chip>
 *   - Otherwise it is a plain tag:                            <Chip>stress</Chip>
 *   size: "sm" (default) | "md" (bigger, for main choices)
 */
const SIZES = { sm: "min-h-9 px-4 text-small", md: "min-h-12 px-6 text-body" };

export default function Chip({ selected = false, onClick, as: Component, size = "sm", icon: Icon, className, children, ...props }) {
  const look = cx(
    "inline-flex items-center gap-2 rounded-pill font-semibold transition",
    SIZES[size],
    selected ? "bg-ink-900 text-white" : "bg-surface text-ink-900 ring-2 ring-line",
    className,
  );
  const icon = Icon && <Icon aria-hidden="true" className={size === "md" ? "size-5" : "size-4"} />;

  if (Component) {
    return (
      <Component className={cx(look, "hover:-translate-y-0.5 hover:shadow-soft hover:ring-ink-500")} {...props}>
        {icon}{children}
      </Component>
    );
  }
  if (!onClick) return <span className={look}>{icon}{children}</span>;
  return (
    <button type="button" aria-pressed={selected} onClick={onClick} className={cx(look, !selected && "hover:ring-ink-500")}>
      {selected ? <Check aria-hidden="true" className="size-4" /> : icon}
      {children}
    </button>
  );
}
