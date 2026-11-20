/**
 * SemiGauge: a soft half-circle that fills up to score / max. Gentle colours only (no red).
 * The number sits in the middle. Screen readers get "Score 12 out of 27" instead of the drawing.
 */
const ARC = "M 20 100 A 80 80 0 0 1 180 100"; // left to right over the top

export default function SemiGauge({ score, max }) {
  const percent = Math.min(100, Math.max(0, (score / max) * 100));

  return (
    <div role="img" aria-label={`Score ${score} out of ${max}`} className="mx-auto w-full max-w-xs">
      <svg viewBox="0 0 200 116" aria-hidden="true" className="w-full">
        {/* pathLength=100 lets us draw the fill as a plain percentage */}
        <path d={ARC} pathLength="100" fill="none" strokeWidth="18" strokeLinecap="round" className="stroke-line" />
        {percent > 0 && (
          <path
            d={ARC}
            pathLength="100"
            fill="none"
            strokeWidth="18"
            strokeLinecap="round"
            className="animate-gauge stroke-brand-300"
            style={{ "--gauge": percent, strokeDasharray: `${percent} 100` }}
          />
        )}
        <text x="100" y="92" textAnchor="middle" className="fill-ink-900 font-heading font-extrabold" style={{ fontSize: 44 }}>
          {score}
        </text>
        <text x="100" y="112" textAnchor="middle" className="fill-ink-700 font-body" style={{ fontSize: 13 }}>
          out of {max}
        </text>
      </svg>
    </div>
  );
}
