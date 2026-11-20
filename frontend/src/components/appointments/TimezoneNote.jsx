import { Globe } from "lucide-react";
import { timeZoneName } from "../../utils/dates";

/** Reminds the user that every time on screen is in their own time zone. */
export default function TimezoneNote({ className }) {
  return (
    <p className={`flex items-center gap-1.5 text-small text-ink-700 ${className ?? ""}`}>
      <Globe aria-hidden="true" className="size-4" /> Times are shown in your local time ({timeZoneName()}).
    </p>
  );
}
