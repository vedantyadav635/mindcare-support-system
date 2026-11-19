import { ChevronDown } from "lucide-react";
import { forwardRef } from "react";
import { cx } from "./cx";
import { FIELD_BASE } from "./fieldStyles";

/**
 * Select: native dropdown (best for keyboards and phones) styled as a pill.
 * <Select value={v} onChange={...}><option value="a">A</option></Select>
 */
const Select = forwardRef(function Select({ className, children, ...props }, ref) {
  return (
    <div className="relative">
      <select ref={ref} className={cx(FIELD_BASE, "min-h-12 cursor-pointer appearance-none rounded-pill pr-12", className)} {...props}>
        {children}
      </select>
      <ChevronDown aria-hidden="true" className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-ink-700" />
    </div>
  );
});

export default Select;
