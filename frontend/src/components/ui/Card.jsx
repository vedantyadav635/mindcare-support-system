import { cx } from "./cx";

/**
 * Card: white rounded panel with a soft shadow.
 *   tint:    optional soft background, e.g. "brand" | "peach" | "sky" | "lilac" | "mint" | "sun" | "blush" | "sand"
 *   padding: "md" (p-6) | "lg" (p-6 on mobile, p-8 from md up) | "none"
 *   hover:   lifts slightly on hover (for clickable cards)
 *   as:      HTML element to render, e.g. as="section" or as="article"
 */
const TINTS = {
  none: "bg-surface",
  brand: "bg-brand-50",
  peach: "bg-brand-100", // stronger soft orange, for hero cards
  sky: "bg-sky/20",
  lilac: "bg-lilac/20",
  mint: "bg-mint/20",
  sun: "bg-sun/25",
  blush: "bg-blush/20",
  sand: "bg-sand",
};

const PADDING = { none: "", md: "p-6", lg: "p-6 md:p-8" };

export default function Card({ tint = "none", padding = "lg", hover = false, as: Component = "div", className, ...props }) {
  return (
    <Component
      className={cx(
        "rounded-lg shadow-soft",
        TINTS[tint],
        PADDING[padding],
        hover && "transition hover:-translate-y-1 hover:shadow-lift",
        className,
      )}
      {...props}
    />
  );
}
