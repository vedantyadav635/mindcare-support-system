/** A short preview (first 3) of requests waiting for the counsellor, with a link to handle them. */
import { Link } from "react-router-dom";
import { formatTimeRange, longDate } from "../../utils/format";
import { Avatar, Button, Card, EmptyState } from "../ui";

const PREVIEW_COUNT = 3;

export default function PendingPreview({ requests }) {
  if (requests.length === 0) {
    return <EmptyState title="No requests waiting" text="New session requests from students will appear here." />;
  }
  const shown = requests.slice(0, PREVIEW_COUNT);

  return (
    <div>
      <ul className="space-y-3">
        {shown.map((request) => (
          <li key={request.id}>
            <Card padding="md" className="flex items-start gap-4">
              <Avatar name={request.student_name} />
              <div className="min-w-0 flex-1">
                <p className="font-heading font-bold text-ink-900">{request.student_name}</p>
                <p className="text-small text-ink-700">{longDate(request.start_time)}, {formatTimeRange(request.start_time, request.end_time)}</p>
                <p className="mt-1 line-clamp-2 text-ink-700">{request.reason}</p>
              </div>
            </Card>
          </li>
        ))}
      </ul>
      <Button as={Link} to="/counsellor/appointments" className="mt-4">
        {requests.length > PREVIEW_COUNT ? `Review all ${requests.length} requests` : "Review and respond"}
      </Button>
    </div>
  );
}
