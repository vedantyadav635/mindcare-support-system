/**
 * Day maths in the viewer's LOCAL time zone (the API sends exact moments with a timezone; we show and group
 * them as the person's own calendar days).
 */
const pad = (n) => String(n).padStart(2, "0");

/** A Date or ISO string -> "YYYY-MM-DD" for the viewer's local day. Also the format <input type="date"> uses. */
export function dayKey(value) {
  const d = value instanceof Date ? value : new Date(value);
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

export const startOfDay = (d = new Date()) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
export const addDays = (d, n) => new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);

/** The Monday of the week containing d. */
export function startOfWeek(d = new Date()) {
  const day = startOfDay(d);
  return addDays(day, -((day.getDay() + 6) % 7));
}

/** Seven consecutive days starting at `start`. */
export const sevenDays = (start) => Array.from({ length: 7 }, (_, i) => addDays(start, i));

/** Whole days from a to b (local calendar days). */
export const daysBetween = (a, b) => Math.round((startOfDay(b) - startOfDay(a)) / 86_400_000);

/** { "2026-11-20": [item, ...] } with items grouped by local day and sorted by time. */
export function groupByDay(items, getIso) {
  const groups = {};
  for (const item of [...items].sort((a, b) => new Date(getIso(a)) - new Date(getIso(b)))) {
    (groups[dayKey(getIso(item))] ??= []).push(item);
  }
  return groups;
}

/** Local date + time from the form inputs ("2026-11-20", "10:00") -> an ISO string with the exact moment (UTC). */
export const toIso = (date, time) => new Date(`${date}T${time}`).toISOString();

/** e.g. "Asia/Kolkata" */
export const timeZoneName = () => Intl.DateTimeFormat().resolvedOptions().timeZone;
