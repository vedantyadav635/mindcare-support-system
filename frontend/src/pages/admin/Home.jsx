/** /admin: overview from GET /api/admin/stats. Counts only: no names and no private text. */
import { CalendarCheck, ClipboardList, GraduationCap, ShieldAlert, SunMedium, Users } from "lucide-react";
import * as adminApi from "../../api/admin";
import AppointmentsChart from "../../components/admin/AppointmentsChart";
import ErrorNotice from "../../components/ErrorNotice";
import StatTile from "../../components/StatTile";
import { Button, PageHeader, Spinner } from "../../components/ui";
import useApi from "../../hooks/useApi";

const icon = (Icon) => <Icon className="size-6 text-ink-900" />;

export default function AdminHome() {
  const { data, error, loading, reload } = useApi(adminApi.stats);

  if (loading) return <div className="flex justify-center py-24 text-brand-500"><Spinner size="lg" label="Loading the overview" /></div>;
  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <h1>Overview</h1>
        <ErrorNotice>{error}</ErrorNotice>
        <Button onClick={reload}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <PageHeader title="Overview" subtitle="Counts only. No names, no private text." />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        <StatTile tint="sky" icon={icon(GraduationCap)} title="Students" value={data.students} />
        <StatTile tint="lilac" icon={icon(Users)} title="Counsellors" value={data.counsellors} />
        <StatTile tint="peach" icon={icon(ShieldAlert)} title="Open crisis alerts" value={data.open_alerts} detail={data.open_alerts > 0 ? "Counsellors are notified" : "None open"} />
        <StatTile tint="sun" icon={icon(SunMedium)} title="Check-ins this week" value={data.wellbeing_entries_this_week} detail="Last 7 days" />
        <StatTile tint="mint" icon={icon(ClipboardList)} title="Self-checks this week" value={data.assessments_this_week} detail="Last 7 days" />
        <StatTile tint="blush" icon={icon(CalendarCheck)} title="Appointments" value={Object.values(data.appointments_by_status).reduce((a, b) => a + b, 0)} detail="All time" />
      </div>

      <AppointmentsChart counts={data.appointments_by_status} />
    </div>
  );
}
