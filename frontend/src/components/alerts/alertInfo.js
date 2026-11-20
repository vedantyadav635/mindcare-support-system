/** How crisis alerts look and sort. Calm colours: the danger colour is used ONLY for the left border of an open alert. */
import { ClipboardList, MessageCircle, SunMedium } from "lucide-react";

export const SOURCE = {
  chat: { label: "Chat", icon: MessageCircle },
  assessment: { label: "Self-check", icon: ClipboardList },
  checkin: { label: "Check-in", icon: SunMedium },
};

export const STATUS = {
  open: { badge: "brand", label: "Open", border: "border-danger" },
  seen: { badge: "info", label: "Seen", border: "border-warning" },
  closed: { badge: "neutral", label: "Closed", border: "border-line" },
};

const ORDER = { open: 0, seen: 1, closed: 2 };

/** Open alerts first, then seen, then closed; newest first within each group. */
export function sortAlerts(alerts) {
  return [...alerts].sort(
    (a, b) => ORDER[a.status] - ORDER[b.status] || new Date(b.created_at) - new Date(a.created_at),
  );
}

/** Filter chips: [value, label]. "" = all. */
export const FILTERS = [["", "All"], ["open", "Open"], ["seen", "Seen"], ["closed", "Closed"]];
