/**
 * One crisis alert. Calm: a white card; the danger colour appears ONLY on the left border (open alerts).
 * Shows who, when, where it came from, why it was flagged, and the short excerpt. Never the full text.
 *   onStatus(alert, "seen" | "closed" | "open")   busy: disables the buttons while a change is saving
 */
import { CalendarPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { formatDateTime, timeAgo } from "../../utils/format";
import { Badge, Button, Card, cx } from "../ui";
import { SOURCE, STATUS } from "./alertInfo";

export default function AlertCard({ alert, onStatus, busy }) {
  const status = STATUS[alert.status];
  const source = SOURCE[alert.source];
  const SourceIcon = source.icon;

  return (
    <Card padding="md" className={cx("border-l-4", status.border)}>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h2 className="min-w-0 flex-1 truncate text-h3">{alert.student_name}</h2>
        <Badge status="neutral"><SourceIcon aria-hidden="true" className="size-3.5" /> {source.label}</Badge>
        <Badge status={status.badge}>{status.label}</Badge>
      </div>

      <p className="mt-1 text-small text-ink-700">
        <time dateTime={alert.created_at}>{formatDateTime(alert.created_at)}</time> · {timeAgo(alert.created_at)}
      </p>
      <p className="mt-1 text-small text-ink-700">Flagged because: <span className="font-semibold text-ink-900">{alert.reason}</span></p>

      {alert.excerpt && (
        <figure className="mt-4 rounded-md bg-sand px-4 py-3">
          <blockquote className="whitespace-pre-wrap break-words text-ink-900">“{alert.excerpt}”</blockquote>
          <figcaption className="mt-1 text-small text-ink-700">A short excerpt only, not the full message.</figcaption>
        </figure>
      )}

      <div className="mt-4 flex flex-wrap gap-2">
        {alert.status === "open" && (
          <Button size="sm" onClick={() => onStatus(alert, "seen")} disabled={busy} aria-label={`Mark the alert for ${alert.student_name} as seen`}>
            Mark as seen
          </Button>
        )}
        {alert.status !== "closed" && (
          <Button variant="secondary" size="sm" onClick={() => onStatus(alert, "closed")} disabled={busy} aria-label={`Close the alert for ${alert.student_name}`}>
            Close
          </Button>
        )}
        {alert.status === "closed" && (
          <Button variant="ghost" size="sm" onClick={() => onStatus(alert, "open")} disabled={busy} aria-label={`Reopen the alert for ${alert.student_name}`}>
            Reopen
          </Button>
        )}
        <Button as={Link} to="/counsellor/availability" state={{ forStudent: alert.student_name }} variant="secondary" size="sm" aria-label={`Schedule a session for ${alert.student_name}`}>
          <CalendarPlus aria-hidden="true" className="size-4" /> Schedule session
        </Button>
      </div>
    </Card>
  );
}
