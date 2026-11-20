/**
 * Crisis / helpline screen. Two routes use it:
 *   /help      public, no login needed (inside the public layout)
 *   /app/help  inside the app (the "Need help now?" pill), and where risky check-ins, self-checks go
 *
 * It needs NO API call: the numbers come from config.js, so it loads instantly and works even if the
 * server is down. If we arrived with a crisis_response (router state), its message, extra numbers and
 * the campus counsellor contact are merged in.
 * Calm on purpose: soft warm background, no playful decoration, no red.
 */
import { CalendarHeart, LogIn } from "lucide-react";
import { Link, useLocation } from "react-router-dom";
import CallButtons from "../components/crisis/CallButtons";
import GroundingExercise from "../components/crisis/GroundingExercise";
import { callOptions } from "../components/crisis/helplines";
import { Button, Card } from "../components/ui";
import { useAuth } from "../context/AuthContext";

export default function Help() {
  const { role } = useAuth();
  const location = useLocation();
  const crisis = location.state?.crisisResponse ?? null;
  const { options, campusText } = callOptions(crisis);
  const inApp = location.pathname.startsWith("/app");

  return (
    <div className={inApp ? "mx-auto max-w-2xl" : "mx-auto max-w-2xl px-4 py-10 md:px-6"}>
      <div className="rounded-xl bg-brand-50 p-6 md:p-8">
        <h1>You don't have to go through this alone.</h1>
        <p className="mt-3 text-ink-900">Please reach out right now. These numbers are free to call, any time of day or night.</p>
        {crisis?.message && <p className="mt-3 text-ink-700">{crisis.message}</p>}
      </div>

      <section aria-labelledby="call-title" className="mt-8">
        <h2 id="call-title" className="mb-4 text-h3">Call now</h2>
        <CallButtons options={options} />
        {campusText && (
          <Card tint="sand" padding="md" className="mt-3">
            <p className="font-heading font-bold text-ink-900">Your campus counsellor</p>
            <p className="mt-1 text-ink-700">{campusText}</p>
          </Card>
        )}
      </section>

      <section aria-labelledby="session-title" className="mt-8">
        <Card tint="mint" padding="md">
          <h2 id="session-title" className="text-h3">Talk to a counsellor soon</h2>
          {role === "student" ? (
            <>
              <p className="mt-2 text-ink-700">Book the earliest free session with your campus counsellor.</p>
              {/* state.book opens the booking flow straight away */}
              <Button as={Link} to="/app/appointments" state={{ book: true }} className="mt-4">
                <CalendarHeart aria-hidden="true" className="size-5" /> Book an urgent session
              </Button>
            </>
          ) : role ? (
            <p className="mt-2 text-ink-700">Please use one of the numbers above, or speak to a colleague right away.</p>
          ) : (
            <>
              <p className="mt-2 text-ink-700">Students can log in to book the earliest free session with a campus counsellor.</p>
              <Button as={Link} to="/login" state={{ from: "/app/appointments" }} variant="secondary" className="mt-4">
                <LogIn aria-hidden="true" className="size-5" /> Log in to book a session
              </Button>
            </>
          )}
        </Card>
      </section>

      <div className="mt-8">
        <GroundingExercise />
      </div>
    </div>
  );
}
