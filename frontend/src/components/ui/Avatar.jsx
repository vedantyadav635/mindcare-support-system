import { cx } from "./cx";

/**
 * Avatar: a person's initials in a coloured circle. The colour is picked from the name,
 * so the same person always gets the same colour.
 * <Avatar name="Meera Rao" size="md" />
 */
const COLORS = ["bg-sky", "bg-lilac", "bg-mint", "bg-sun", "bg-blush", "bg-brand-300"];
const SIZES = { sm: "size-8 text-small", md: "size-12 text-body", lg: "size-16 text-h3" };

function initials(name = "") {
  const words = name.replace(/^(dr|mr|ms|mrs|prof)\.?\s+/i, "").trim().split(/\s+/);
  return ((words[0]?.[0] ?? "") + (words.length > 1 ? words.at(-1)[0] : "")).toUpperCase() || "?";
}

function colorFor(name = "") {
  const sum = [...name].reduce((total, ch) => total + ch.charCodeAt(0), 0);
  return COLORS[sum % COLORS.length];
}

export default function Avatar({ name, size = "md", className }) {
  return (
    <span
      role="img"
      aria-label={name}
      className={cx("inline-flex shrink-0 items-center justify-center rounded-pill font-heading font-extrabold text-ink-900", colorFor(name), SIZES[size], className)}
    >
      <span aria-hidden="true">{initials(name)}</span>
    </span>
  );
}
