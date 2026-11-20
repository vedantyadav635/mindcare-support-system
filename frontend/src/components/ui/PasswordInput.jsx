import { Eye, EyeOff } from "lucide-react";
import { forwardRef, useState } from "react";
import { cx } from "./cx";
import Input from "./Input";

/**
 * PasswordInput: an Input with a show/hide button. Works inside <FormField> like any Input.
 * Use autoComplete="current-password" (login) or "new-password" (register).
 */
const PasswordInput = forwardRef(function PasswordInput({ className, ...props }, ref) {
  const [shown, setShown] = useState(false);
  const Icon = shown ? EyeOff : Eye;

  return (
    <div className="relative">
      <Input ref={ref} type={shown ? "text" : "password"} className={cx("pr-14", className)} {...props} />
      <button
        type="button"
        aria-label={shown ? "Hide password" : "Show password"}
        aria-pressed={shown}
        onClick={() => setShown(!shown)}
        className="absolute right-2 top-1/2 -translate-y-1/2 rounded-pill p-2 text-ink-700 transition hover:bg-sand hover:text-ink-900"
      >
        <Icon aria-hidden="true" className="size-5" />
      </button>
    </div>
  );
});

export default PasswordInput;
