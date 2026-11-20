/** One of the student's appointments: counsellor, time, status and (when still possible) a Cancel button. */
import { CalendarClock } from "lucide-react";
import { formatTimeRange, longDate } from "../../utils/format";
import StatusBadge from "../StatusBadge";
import { Avatar, Button, Card } from "../ui";

export default function StudentAppointmentCard({ appointment, onCancel }) {
  const { status, counsellor_name: name, start_time: start, end_time: end, reason } = appointment;
  const canCancel = onCancel && (status === "requested" || status === "confirmed");

  return (
    <Card padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-start">
      <Avatar name={name} size="lg" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <p className="font-heading text-h3 font-bold text-ink-900">{name}</p>
          <StatusBadge status={status} />
        </div>
        <p className="mt-1 flex items-center gap-2 text-ink-900">
          <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
          {longDate(start)}, {formatTimeRange(start, end)}
        </p>
        {status === "requested" && <p className="mt-1 text-small text-ink-700">Waiting for your counsellor to confirm.</p>}
        <p className="mt-3 line-clamp-3 break-words rounded-md bg-sand px-3 py-2 text-small text-ink-700">
          <span className="font-semibold text-ink-900">Your reason: </span>{reason}
        </p>
      </div>
      {canCancel && (
        <Button variant="secondary" size="sm" onClick={() => onCancel(appointment)} aria-label={`Cancel your session with ${name}`}>
          Cancel
        </Button>
      )}
    </Card>
  );
}
