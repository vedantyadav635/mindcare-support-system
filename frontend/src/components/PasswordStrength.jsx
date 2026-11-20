/**
 * PasswordStrength: a friendly hint under the password box (3-step bar + a word).
 * The word carries the meaning, so it doesn't rely on colour alone. Only inline elements,
 * so it can sit inside a FormField hint.
 * The backend only requires 8 to 72 characters; this is guidance, not a rule.
 */
import { cx } from "./ui";

export function rate(password) {
  if (!password) return { points: 0, label: "", tip: "Use at least 8 characters." };
  if (password.length < 8) return { points: 0, label: "Too short", tip: "Use at least 8 characters." };

  const classes = [/[a-z]/, /[A-Z]/, /\d/, /[^A-Za-z0-9]/].filter((re) => re.test(password)).length;
  const points = 1 + (password.length >= 12) + (classes >= 3); // 1..3
  const label = ["", "Okay", "Good", "Strong"][points];
  return { points, label, tip: points === 3 ? "Nice and strong." : "Longer, with letters, numbers and symbols, is stronger." };
}

export default function PasswordStrength({ password }) {
  const { points, label, tip } = rate(password);
  return (
    <span className="flex flex-col gap-1.5">
      <span aria-hidden="true" className="flex gap-1.5">
        {[1, 2, 3].map((step) => (
          <span key={step} className={cx("h-1.5 flex-1 rounded-pill transition", step <= points ? "bg-brand-500" : "bg-line")} />
        ))}
      </span>
      {/* aria-live: screen readers hear the rating when it changes */}
      <span aria-live="polite">
        {label && <strong className="text-ink-900">{label}. </strong>}
        {tip}
      </span>
    </span>
  );
}
