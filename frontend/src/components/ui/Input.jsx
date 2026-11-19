import { forwardRef } from "react";
import { cx } from "./cx";
import { FIELD_BASE } from "./fieldStyles";

/**
 * Input: single-line text field (pill shaped). Use inside <FormField> to get a label and error text.
 * Any normal <input> prop works: type, value, onChange, required, autoComplete, ...
 */
const Input = forwardRef(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cx(FIELD_BASE, "min-h-12 rounded-pill", className)} {...props} />;
});

export default Input;
