import { cx } from "./cx";
import Spinner from "./Spinner";

/**
 * Button: rounded pill.
 *   variant: "primary" (orange) | "secondary" (white with border) | "ghost" | "danger"
 *   size:    "sm" | "md" | "lg"
 *   loading: shows a spinner and blocks clicks
 *   as:      render as another element, e.g. as={Link} to="/home" (default <button>)
 *
 * Accessibility: the primary button uses dark text on orange (white on orange fails contrast).
 */
const VARIANTS = {
  primary: "bg-brand-500 text-ink-900 shadow-soft hover:-translate-y-0.5 hover:shadow-lift active:translate-y-0 active:bg-brand-600",
  secondary: "border-2 border-line bg-surface text-ink-900 hover:border-ink-500 active:bg-sand",
  ghost: "text-ink-900 hover:bg-sand active:bg-line",
  danger: "border-2 border-danger bg-surface text-ink-900 hover:bg-danger/10 active:bg-danger/20",
};

const SIZES = {
  sm: "min-h-9 px-4 text-small",
  md: "min-h-12 px-6 text-body",
  lg: "min-h-14 px-8 text-h3",
};

export default function Button({
  variant = "primary",
  size = "md",
  loading = false,
  disabled = false,
  as: Component = "button",
  className,
  children,
  ...props
}) {
  const isButton = Component === "button";
  return (
    <Component
      // type="button" stops accidental form submits; pass type="submit" when needed
      {...(isButton && { type: "button", disabled: disabled || loading })}
      aria-busy={loading || undefined}
      aria-disabled={!isButton && (disabled || loading) ? true : undefined}
      className={cx(
        "inline-flex select-none items-center justify-center gap-2 rounded-pill font-heading font-bold transition",
        "disabled:pointer-events-none disabled:opacity-50",
        VARIANTS[variant],
        SIZES[size],
        className,
      )}
      {...props}
    >
      {loading && <Spinner size="sm" label="Please wait" />}
      {children}
    </Component>
  );
}
