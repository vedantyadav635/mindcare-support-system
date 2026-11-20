/** /app/checkin: loads the questions and today's status, then runs the one-question-at-a-time flow. */
import { Link } from "react-router-dom";
import * as checkinApi from "../../api/checkin";
import CheckInFlow from "../../components/checkin/CheckInFlow";
import ErrorNotice from "../../components/ErrorNotice";
import { Button, EmptyState, Spinner } from "../../components/ui";
import useApi from "../../hooks/useApi";

// Defined outside the component so useApi sees the same function on every render
const load = () => Promise.all([checkinApi.questions(), checkinApi.today()]);

export default function CheckIn() {
  const { data, error, loading, reload } = useApi(load);

  if (loading) {
    return <div className="flex justify-center py-24 text-brand-500"><Spinner size="lg" label="Loading your check-in" /></div>;
  }

  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <h1>Check-in</h1>
        <ErrorNotice>{error}</ErrorNotice>
        <Button onClick={reload}>Try again</Button>
      </div>
    );
  }

  const [questions, today] = data;
  if (questions.length === 0) {
    return (
      <div className="mx-auto max-w-xl py-8">
        <h1 className="sr-only">Daily check-in</h1>
        <EmptyState
          title="No check-in questions yet"
          text="The questions haven't been set up. Please check back soon, or ask your college's admin."
          action={<Button as={Link} to="/app" variant="secondary">Back to home</Button>}
        />
      </div>
    );
  }

  return <CheckInFlow questions={questions} todayEntry={today.entry} />;
}
