/** /counsellor: today at a glance, from one call to GET /api/dashboard/counsellor. */
import { CalendarClock, Inbox, ShieldAlert } from "lucide-react";
import { useState } from "react";
import { Link } from "react-router-dom";
import * as dashboardApi from "../../api/dashboard";
import PendingPreview from "../../components/counsellor/PendingPreview";
import TodayTimeline from "../../components/counsellor/TodayTimeline";
import ErrorNotice from "../../components/ErrorNotice";
import StatTile from "../../components/StatTile";
import { Button, PageHeader, Spinner } from "../../components/ui";
import useApi from "../../hooks/useApi";
import { longDate } from "../../utils/format";

/** A stat tile that is also a link to where you act on it. */
function LinkTile({ to, label, ...tile }) {
  return (
    <Link to={to} aria-label={label} className="block rounded-lg transition hover:-translate-y-1">
      <StatTile {...tile} />
    </Link>
  );
}

export default function CounsellorHome() {
  const { data, error, loading, reload } = useApi(dashboardApi.counsellor);
  const [now] = useState(() => new Date()); // "today" for this visit

  if (loading) return <div className="flex justify-center py-24 text-brand-500"><Spinner size="lg" label="Loading your day" /></div>;
  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <h1>Your day</h1>
        <ErrorNotice>{error}</ErrorNotice>
        <Button onClick={reload}>Try again</Button>
      </div>
    );
  }

  const { open_alerts: openAlerts, todays_appointments: today, pending_requests: pending } = data;

  return (
    <div className="space-y-10">
      <PageHeader title="Your day" subtitle={longDate(now)} />

      <div className="grid gap-3 sm:grid-cols-3">
        <LinkTile
          to="/counsellor/alerts"
          label={`Open alerts: ${openAlerts}. Go to alerts`}
          tint="peach"
          icon={<ShieldAlert className="size-6 text-ink-900" />}
          title="Open alerts"
          value={openAlerts}
          detail={openAlerts > 0 ? "Students who may need support" : "All clear for now"}
        />
        <LinkTile
          to="/counsellor/appointments"
          label={`Sessions today: ${today.length}. Go to appointments`}
          tint="sky"
          icon={<CalendarClock className="size-6 text-ink-900" />}
          title="Sessions today"
          value={today.length}
          detail={today.length > 0 ? "See the timeline below" : "Nothing scheduled"}
        />
        <LinkTile
          to="/counsellor/appointments"
          label={`Pending requests: ${pending.length}. Go to appointments`}
          tint="sun"
          icon={<Inbox className="size-6 text-ink-900" />}
          title="Pending requests"
          value={pending.length}
          detail={pending.length > 0 ? "Waiting for your answer" : "Nothing waiting"}
        />
      </div>

      <section aria-labelledby="today-title">
        <h2 id="today-title" className="mb-5">Today's schedule</h2>
        <TodayTimeline appointments={today} now={now} />
      </section>

      <section aria-labelledby="pending-title">
        <h2 id="pending-title" className="mb-5">Requests waiting for you</h2>
        <PendingPreview requests={pending} />
      </section>
    </div>
  );
}
