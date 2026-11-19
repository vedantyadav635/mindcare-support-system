import { cx } from "./cx";

/**
 * SectionBlob: flat decorative shapes (original, drawn from basic SVG). Always hidden from screen readers.
 *   shape: "blob" | "circle" | "ring" | "arc" | "star" | "smile" (a simple smiling-circle character)
 *   color: "brand" | "sky" | "lilac" | "mint" | "sun" | "blush" | "sand"
 *   float: drifts slowly (off when the user prefers reduced motion)
 * Position it with className, e.g. "absolute -right-8 top-4 size-40".
 */
const FILL = {
  brand: "fill-brand-300",
  sky: "fill-sky",
  lilac: "fill-lilac",
  mint: "fill-mint",
  sun: "fill-sun",
  blush: "fill-blush",
  sand: "fill-sand",
};
const STROKE = {
  brand: "stroke-brand-300",
  sky: "stroke-sky",
  lilac: "stroke-lilac",
  mint: "stroke-mint",
  sun: "stroke-sun",
  blush: "stroke-blush",
  sand: "stroke-sand",
};

const BLOB =
  "M50 6c14 0 27 6 34 18s8 28 2 41-19 25-35 27S20 88 12 76 2 46 8 32 36 6 50 6Z";
const STAR =
  "M50 6 61 38 94 39 68 59 77 92 50 72 23 92 32 59 6 39 39 38Z";

function Shape({ shape, color }) {
  switch (shape) {
    case "circle":
      return <circle cx="50" cy="50" r="46" className={FILL[color]} />;
    case "ring":
      return <circle cx="50" cy="50" r="40" fill="none" strokeWidth="12" className={STROKE[color]} />;
    case "arc":
      return <path d="M10 80 A40 40 0 0 1 90 80" fill="none" strokeWidth="14" strokeLinecap="round" className={STROKE[color]} />;
    case "star":
      return <path d={STAR} strokeLinejoin="round" strokeWidth="6" className={cx(FILL[color], STROKE[color])} />;
    case "smile":
      // A friendly face made of a circle, two dots and a curve
      return (
        <>
          <circle cx="50" cy="50" r="46" className={FILL[color]} />
          <circle cx="36" cy="42" r="5" className="fill-ink-900" />
          <circle cx="64" cy="42" r="5" className="fill-ink-900" />
          <path d="M33 60c9 11 25 11 34 0" fill="none" strokeWidth="6" strokeLinecap="round" className="stroke-ink-900" />
        </>
      );
    default:
      return <path d={BLOB} className={FILL[color]} />;
  }
}

export default function SectionBlob({ shape = "blob", color = "brand", float = false, className }) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" focusable="false" className={cx("pointer-events-none", float && "animate-float", className)}>
      <Shape shape={shape} color={color} />
    </svg>
  );
}
