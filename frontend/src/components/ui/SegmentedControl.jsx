import { useId } from "react";
import { cx } from "./cx";

/**
 * SegmentedControl: a pill with 2-4 choices, one selected (e.g. Week | Month).
 * Built from real radio buttons, so arrow keys and screen readers work.
 *
 * <SegmentedControl label="Period" value={period} onChange={setPeriod}
 *   options={[{ value: "week", label: "Week" }, { value: "month", label: "Month" }]} />
 */
export default function SegmentedControl({ label, options, value, onChange, className }) {
  const name = useId();
  return (
    <div role="radiogroup" aria-label={label} className={cx("inline-flex rounded-pill bg-sand p-1", className)}>
      {options.map((option) => {
        const selected = option.value === value;
        return (
          <label
            key={option.value}
            className={cx(
              "min-h-10 cursor-pointer rounded-pill px-5 py-2 font-heading font-bold transition",
              "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink-900",
              selected ? "bg-surface text-ink-900 shadow-soft" : "text-ink-700 hover:text-ink-900",
            )}
          >
            <input type="radio" name={name} value={option.value} checked={selected} onChange={() => onChange(option.value)} className="sr-only" />
            {option.label}
          </label>
        );
      })}
    </div>
  );
}
