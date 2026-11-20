/** The student's next session, or an invitation to book one. */
import { Link } from "react-router-dom";
import { formatDateTime } from "../../utils/format";
import StatusBadge from "../StatusBadge";
import { Avatar, Button, Card } from "../ui";

export default function NextAppointmentCard({ appointment }) {
  return (
    <Card tint={appointment ? "none" : "mint"} className="flex flex-col">
      <h2 className="text-h3">Next session</h2>
      {appointment ? (
        <div className="mt-5 flex-1">
          <div className="flex items-center gap-3">
            <Avatar name={appointment.counsellor_name} />
            <div className="min-w-0">
              <p className="truncate font-heading font-bold text-ink-900">{appointment.counsellor_name}</p>
              <StatusBadge status={appointment.status} />
            </div>
          </div>
          <p className="mt-4 font-heading text-h3 font-extrabold text-ink-900">{formatDateTime(appointment.start_time)}</p>
        </div>
      ) : (
        <p className="mt-3 flex-1 text-ink-700">No session booked. Talking to a counsellor can really help, and you don't need a big reason.</p>
      )}
      <Button as={Link} to="/app/appointments" variant={appointment ? "secondary" : "primary"} className="mt-6">
        {appointment ? "Manage appointments" : "Book a counsellor"}
      </Button>
    </Card>
  );
}
