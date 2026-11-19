import { cx } from "./cx";

/**
 * Label: text label for a form control. Always pair with the control's id (htmlFor).
 *   optional: shows "(optional)" after the text
 */
export default function Label({ optional = false, className, children, ...props }) {
  return (
    <label className={cx("mb-2 block font-heading text-small font-bold text-ink-900", className)} {...props}>
      {children}
      {optional && <span className="ml-1 font-body font-normal text-ink-700">(optional)</span>}
    </label>
  );
}
