import { Info } from "lucide-react";
import { cx } from "./cx";

/**
 * Disclaimer: small rounded note. Required on assessment, chat and recommendation screens.
 * Without children it shows the standard non-diagnostic text.
 */
export const DEFAULT_DISCLAIMER =
  "This is a support tool, not a diagnosis. If you are in danger, call 112 or Tele-MANAS on 14416 (free, 24x7).";

export default function Disclaimer({ children = DEFAULT_DISCLAIMER, className }) {
  return (
    <p className={cx("flex items-start gap-2.5 rounded-md bg-sand px-4 py-3 text-small text-ink-700", className)}>
      <Info aria-hidden="true" className="mt-0.5 size-4 shrink-0 text-ink-700" />
      <span>{children}</span>
    </p>
  );
}
