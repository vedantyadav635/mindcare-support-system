/**
 * ProgressDots: a row of rounded dots. Finished steps are filled, the current one is a longer pill.
 *   total:     number of steps
 *   current:   1-based step; total + 1 means "all done" (every dot filled)
 *   valueText: what screen readers hear, e.g. "Question 3 of 7" or "Review"
 *   label:     what the bar is for, e.g. "Check-in progress"
 */
import { cx } from "./ui";

export default function ProgressDots({ total, current, valueText, label = "Progress" }) {
  return (
    <div
      role="progressbar"
      aria-label={label}
      aria-valuemin={1}
      aria-valuemax={total + 1}
      aria-valuenow={current}
      aria-valuetext={valueText}
      className="flex items-center justify-center gap-2"
    >
      {Array.from({ length: total }, (_, i) => {
        const step = i + 1;
        return (
          <span
            key={step}
            aria-hidden="true"
            className={cx("h-3 rounded-pill transition-all duration-200", step === current ? "w-8 bg-brand-500" : step < current ? "w-3 bg-brand-500" : "w-3 bg-line")}
          />
        );
      })}
    </div>
  );
}
