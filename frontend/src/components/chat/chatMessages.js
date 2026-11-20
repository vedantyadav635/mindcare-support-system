/**
 * Pure helpers for the chat list. Messages live only in memory (component state), never in browser storage.
 * A message: { id, sender: "student" | "bot", text, created_at, resources?, crisis? }
 */
import { daysBetween } from "../../utils/dates";
import { longDate } from "../../utils/format";

/** GET /chat/history returns newest first; the screen shows oldest first. */
export const oldestFirst = (items) =>
  [...items].reverse().map(({ id, sender, text, created_at }) => ({ id, sender, text, created_at }));

/**
 * Put an older page in front of what we already show. History pages are counted from the newest
 * message, so after sending new messages an older page can overlap: drop anything we already have.
 */
export function prependEarlier(current, earlier) {
  const shown = new Set(current.map((m) => m.id));
  return [...earlier.filter((m) => !shown.has(m.id)), ...current];
}

/** "Today", "Yesterday" or "Thursday, 20 November" for the separators between days. */
export function dayLabel(iso, now = new Date()) {
  const ago = daysBetween(new Date(iso), now);
  return ago === 0 ? "Today" : ago === 1 ? "Yesterday" : longDate(iso);
}

/** Are there older messages to load? (page and total come from the history response) */
export const hasOlder = ({ page, page_size: pageSize, total }) => page * pageSize < total;
