/** /app: the student's home, from one call to GET /api/dashboard/student. */
import { Link } from "react-router-dom";
import * as dashboardApi from "../../api/dashboard";
import ErrorNotice from "../../components/ErrorNotice";
import HomeHero from "../../components/home/HomeHero";
import NextAppointmentCard from "../../components/home/NextAppointmentCard";
import QuickActions from "../../components/home/QuickActions";
import WeekCard from "../../components/home/WeekCard";
import ResourceCard from "../../components/ResourceCard";
import { Button, Disclaimer, EmptyState, Spinner } from "../../components/ui";
import useApi from "../../hooks/useApi";

export default function StudentHome() {
  const { data, error, loading, reload } = useApi(dashboardApi.student);

  if (loading) return <div className="flex justify-center py-24 text-brand-500"><Spinner size="lg" label="Loading your home" /></div>;
  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <h1>Your home</h1>
        <ErrorNotice>{error}</ErrorNotice>
        <Button onClick={reload}>Try again</Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <HomeHero done={data.checkin_done_today} />
      <QuickActions />

      <div className="grid gap-6 lg:grid-cols-3">
        <WeekCard trend={data.trend} className="lg:col-span-2" />
        <NextAppointmentCard appointment={data.next_appointment} />
      </div>

      <section aria-labelledby="picks-title">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-2">
          <h2 id="picks-title">Picked for you</h2>
          <Button as={Link} to="/app/resources" variant="ghost" size="sm">See all</Button>
        </div>
        {data.recommendations.length === 0 ? (
          <EmptyState title="No suggestions yet" text="Check in for a few days and we'll pick things that suit you." />
        ) : (
          <ul className="grid gap-6 md:grid-cols-3">
            {data.recommendations.map(({ resource, why }) => (
              <li key={resource.id}><ResourceCard resource={resource} why={why} /></li>
            ))}
          </ul>
        )}
        {/* Recommendation screens always show the non-diagnostic disclaimer */}
        <Disclaimer className="mt-6" />
      </section>
    </div>
  );
}
