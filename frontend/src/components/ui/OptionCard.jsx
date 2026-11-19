import { cx } from "./cx";

/**
 * OptionCard: big, friendly answer choice (check-in and self-check questions).
 * It is a real radio button underneath, so arrow keys and screen readers work.
 * Put a group of them inside <fieldset> with a <legend> (the question).
 *
 * <OptionCard name="mood" value={4} checked={mood === 4} onChange={() => setMood(4)} emoji="🙂" label="Good" />
 */
export default function OptionCard({ name, value, checked, onChange, label, description, emoji, className }) {
  return (
    <label
      className={cx(
        "group relative flex cursor-pointer items-center gap-4 rounded-lg border-2 bg-surface p-4 transition md:p-5",
        "hover:-translate-y-0.5 hover:shadow-soft",
        checked ? "border-brand-500 bg-brand-50 shadow-soft" : "border-line hover:border-ink-500",
        // The radio itself is hidden, so show the keyboard focus ring on the card
        "has-[:focus-visible]:outline-3 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ink-900",
        className,
      )}
    >
      <input type="radio" name={name} value={value} checked={checked} onChange={onChange} className="sr-only" />
      {emoji && (
        <span aria-hidden="true" className={cx("text-3xl transition", checked && "scale-110")}>
          {emoji}
        </span>
      )}
      <span className="flex-1">
        <span className="block font-heading text-body font-bold text-ink-900">{label}</span>
        {description && <span className="mt-0.5 block text-small text-ink-700">{description}</span>}
      </span>
      {/* Round tick indicator */}
      <span
        aria-hidden="true"
        className={cx(
          "flex size-6 shrink-0 items-center justify-center rounded-pill border-2 transition",
          checked ? "border-brand-500 bg-brand-500" : "border-line",
        )}
      >
        {checked && <span className="size-2.5 rounded-pill bg-ink-900" />}
      </span>
    </label>
  );
}
