import { cx } from "./cx";

/**
 * Switch: an on/off toggle (e.g. "Active", "Required"). A real button with role="switch", so keyboards
 * (Space/Enter) and screen readers work. Give it a stable `label`; show the visible words yourself.
 *
 * <Switch label="Account active for Asha" checked={active} onChange={setActive} />
 */
export default function Switch({ checked, onChange, label, disabled = false, className }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cx(
        "relative inline-flex h-8 w-14 shrink-0 items-center rounded-pill transition disabled:cursor-not-allowed disabled:opacity-50",
        checked ? "bg-brand-500" : "bg-line",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cx("inline-block size-6 rounded-pill bg-surface shadow-soft transition", checked ? "translate-x-7" : "translate-x-1")}
      />
    </button>
  );
}
