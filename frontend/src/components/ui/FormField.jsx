import { CircleAlert } from "lucide-react";
import { cloneElement, useId } from "react";
import Label from "./Label";

/**
 * FormField: label + one control + optional hint + optional error.
 * It wires the accessibility attributes for you (id, aria-invalid, aria-describedby).
 *
 * <FormField label="Email" error={errors.email} hint="Use your college email">
 *   <Input type="email" value={email} onChange={...} />
 * </FormField>
 */
export default function FormField({ label, hint, error, optional = false, children, className }) {
  const id = useId();
  const hintId = hint ? `${id}-hint` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  const control = cloneElement(children, {
    id,
    "aria-invalid": error ? true : undefined,
    "aria-describedby": [hintId, errorId].filter(Boolean).join(" ") || undefined,
  });

  return (
    <div className={className}>
      <Label htmlFor={id} optional={optional}>{label}</Label>
      {control}
      {hint && <p id={hintId} className="mt-1.5 text-small text-ink-700">{hint}</p>}
      {error && (
        // Error text is dark (for contrast); the red icon and border carry the colour
        <p id={errorId} className="mt-1.5 flex items-center gap-1.5 text-small font-semibold text-ink-900">
          <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-danger" />
          {error}
        </p>
      )}
    </div>
  );
}
