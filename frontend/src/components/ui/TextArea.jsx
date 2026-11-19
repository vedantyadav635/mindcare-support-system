import { forwardRef } from "react";
import { cx } from "./cx";
import { FIELD_BASE } from "./fieldStyles";

/**
 * TextArea: multi-line text with a live character counter when maxLength is set.
 * <TextArea maxLength={300} value={text} onChange={...} />   (controlled: always pass value + onChange)
 */
const TextArea = forwardRef(function TextArea(
  { maxLength, value = "", className, id, "aria-describedby": describedBy, ...props },
  ref,
) {
  const counterId = id ? `${id}-count` : undefined;
  const nearLimit = maxLength && value.length > maxLength * 0.9;

  return (
    <div>
      <textarea
        ref={ref}
        id={id}
        value={value}
        maxLength={maxLength}
        // Link both the hint/error (from FormField) and the counter
        aria-describedby={[describedBy, maxLength && counterId].filter(Boolean).join(" ") || undefined}
        className={cx(FIELD_BASE, "min-h-32 resize-y rounded-md py-3", className)}
        {...props}
      />
      {maxLength && (
        // aria-live: screen readers hear the count only when it changes, politely
        <p id={counterId} aria-live="polite" className={cx("mt-1 text-right text-small", nearLimit ? "font-bold text-ink-900" : "text-ink-700")}>
          {value.length} / {maxLength}
        </p>
      )}
    </div>
  );
});

export default TextArea;
