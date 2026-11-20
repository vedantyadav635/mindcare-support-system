/**
 * TodayTimeline: today's sessions as a vertical timeline of rounded cards (a line down the left with a dot per session).
 * Past sessions are shown softer; the dot is orange for what is still ahead. `now` is passed in (a Date).
 */
import { CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { formatTime, formatTimeRange } from "../../utils/format";
import StatusBadge from "../StatusBadge";
import { Button, Card, cx, EmptyState } from "../ui";

export default function TodayTimeline({ appointments, now }) {
  if (appointments.length === 0) {
    return (
      <EmptyState
        title="No sessions today"
        text="A quiet day. You can add free times so students can book you."
        action={<Button as={Link} to="/counsellor/availability" variant="secondary">Add free times</Button>}
      />
    );
  }

  return (
    <ol className="relative ml-3 space-y-4 border-l-2 border-line">
      {appointments.map((appointment) => {
        const over = new Date(appointment.end_time) <= now;
        return (
          <li key={appointment.id} className="relative pl-6">
            <span aria-hidden="true" className={cx("absolute -left-[9px] top-6 size-4 rounded-pill ring-4 ring-cream", over ? "bg-ink-500" : "bg-brand-500")} />
            <Card padding="md" className={cx("flex flex-wrap items-center gap-x-6 gap-y-2", over && "opacity-75")}>
              <div className="w-24 shrink-0">
                <p className="font-heading text-h3 font-extrabold text-ink-900">{formatTime(appointment.start_time)}</p>
                <p className="text-small text-ink-700">{formatTimeRange(appointment.start_time, appointment.end_time)}</p>
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading font-bold text-ink-900">{appointment.student_name}</p>
                <p className="line-clamp-1 text-small text-ink-700">{appointment.reason}</p>
              </div>
              <StatusBadge status={appointment.status} />
              <CalendarCheck aria-hidden="true" className="hidden size-5 text-ink-500 sm:block" />
            </Card>
          </li>
        );
      })}
    </ol>
  );
}
