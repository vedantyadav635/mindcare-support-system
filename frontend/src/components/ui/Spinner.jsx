import { cx } from "./cx";

/**
 * Spinner: a small rotating ring. Always has a screen-reader label.
 * <Spinner />  <Spinner size="sm" label="Saving" />
 */
const SIZES = { sm: "size-4 border-2", md: "size-8 border-3", lg: "size-12 border-4" };

export default function Spinner({ size = "md", label = "Loading", className }) {
  return (
    <span role="status" className={cx("inline-flex items-center justify-center", className)}>
      <span
        aria-hidden="true"
        className={cx("animate-spin rounded-pill border-current border-r-transparent", SIZES[size])}
      />
      <span className="sr-only">{label}</span>
    </span>
  );
}
