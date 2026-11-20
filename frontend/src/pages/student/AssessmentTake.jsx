/** /app/assessments/:type where type is PHQ9 or GAD7 (anything else goes back to the list). */
import { useCallback } from "react";
import { Navigate, useParams } from "react-router-dom";
import * as assessmentsApi from "../../api/assessments";
import AssessmentFlow from "../../components/assessments/AssessmentFlow";
import ErrorNotice from "../../components/ErrorNotice";
import { Button, Spinner } from "../../components/ui";
import useApi from "../../hooks/useApi";

export default function AssessmentTake() {
  const { type } = useParams();
  if (!assessmentsApi.TYPES.includes(type)) return <Navigate to="/app/assessments" replace />;
  // key = type: switching between the two questionnaires starts fresh
  return <Loader key={type} type={type} />;
}

function Loader({ type }) {
  const load = useCallback(() => assessmentsApi.questions(type), [type]);
  const { data, error, loading, reload } = useApi(load);

  if (loading) return <div className="flex justify-center py-24 text-brand-500"><Spinner size="lg" label="Loading the questions" /></div>;
  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <h1>Self-check</h1>
        <ErrorNotice>{error}</ErrorNotice>
        <Button onClick={reload}>Try again</Button>
      </div>
    );
  }
  return <AssessmentFlow type={type} data={data} />;
}
