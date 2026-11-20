/** Small pure helpers for showing dates (Indian English style). */

/** "2026-11-19" -> a Date at local midnight. (new Date("2026-11-19") would be UTC and can show the wrong day.) */
export function parseDay(day) {
  const [year, month, date] = day.split("-").map(Number);
  return new Date(year, month - 1, date);
}

const dayFormatter = (options) => (day) => parseDay(day).toLocaleDateString("en-IN", options);

export const weekdayShort = dayFormatter({ weekday: "short" }); // Mon
export const dayMonth = dayFormatter({ day: "numeric", month: "short" }); // 17 Nov
export const fullDay = dayFormatter({ weekday: "short", day: "numeric", month: "short" }); // Mon, 17 Nov

/**
 * Phone numbers inside a sentence.
 *   phoneNumbers("call 14416 or 1-800-891-4416") -> ["14416", "1-800-891-4416"]
 *   phoneNumbers("Room 101, +91 98765 43210", 8)  -> ["+91 98765 43210"]   (minDigits skips "101")
 * Numbers may contain dashes or spaces and start with "+".
 */
export const digitsOf = (number) => number.replace(/\D/g, "");
export const phoneNumbers = (text, minDigits = 3) =>
  (text.match(/\+?\d[\d -]*\d/g) ?? []).map((n) => n.trim()).filter((n) => digitsOf(n).length >= minDigits);

/** A number as written -> a tel: link ("+91 98765 43210" -> "tel:+919876543210"). */
export const telHref = (number) => `tel:${number.replace(/[^\d+]/g, "")}`;

/** How long ago: "just now", "5 min ago", "3 hours ago", "2 days ago", or the date after a week. */
export function timeAgo(iso, now = new Date()) {
  const minutes = Math.floor((now - new Date(iso)) / 60_000);
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  const days = Math.floor(hours / 24);
  return days < 7 ? `${days} ${days === 1 ? "day" : "days"} ago` : formatDate(iso);
}

/** ISO date-time -> "10:00 am" and "10:00 am – 10:45 am", in the viewer's local time zone. */
export const formatTime = (iso) => new Date(iso).toLocaleTimeString("en-IN", { hour: "numeric", minute: "2-digit" });
export const formatTimeRange = (startIso, endIso) => `${formatTime(startIso)} – ${formatTime(endIso)}`;

/** A Date or ISO string -> "Thursday, 20 November", "Thu", "20 Nov" (local time zone). */
const dateFormatter = (options) => (value) => (value instanceof Date ? value : new Date(value)).toLocaleDateString("en-IN", options);
export const longDate = dateFormatter({ weekday: "long", day: "numeric", month: "long" });
export const shortWeekday = dateFormatter({ weekday: "short" });
export const shortDate = dateFormatter({ day: "numeric", month: "short" });

/** An ISO date-time from the API -> "19 Nov 2026" (in the viewer's timezone). */
export const formatDate = (iso) => new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });

/** An ISO date-time from the API (with timezone) -> "Thu, 20 Nov, 10:00 am" in the viewer's timezone. */
export const formatDateTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", { weekday: "short", day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
