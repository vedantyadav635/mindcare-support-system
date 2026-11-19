import { cx } from "./cx";

/**
 * Badge: small status label with a coloured dot.
 *   status: "success" | "warning" | "danger" | "info" | "brand" | "neutral"
 * The text stays dark for contrast; the dot and tint carry the colour.
 * <Badge status="success">Confirmed</Badge>
 */
const STYLES = {
  success: { bg: "bg-mint/25", dot: "bg-success" },
  warning: { bg: "bg-sun/30", dot: "bg-warning" },
  danger: { bg: "bg-danger/10", dot: "bg-danger" },
  info: { bg: "bg-sky/25", dot: "bg-sky" },
  brand: { bg: "bg-brand-100", dot: "bg-brand-500" },
  neutral: { bg: "bg-sand", dot: "bg-ink-500" },
};

export default function Badge({ status = "neutral", className, children }) {
  const style = STYLES[status];
  return (
    <span className={cx("inline-flex items-center gap-1.5 rounded-pill px-3 py-1 text-small font-semibold text-ink-900", style.bg, className)}>
      <span aria-hidden="true" className={cx("size-2 rounded-pill", style.dot)} />
      {children}
    </span>
  );
}
