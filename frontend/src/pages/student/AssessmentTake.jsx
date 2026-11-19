import { Navigate, useParams } from "react-router-dom";
import { TYPES } from "../../api/assessments";
import PlaceholderPage from "../../components/PlaceholderPage";

const NAMES = { PHQ9: "Mood check (PHQ-9)", GAD7: "Worry check (GAD-7)" };

/** /app/assessments/:type where type is PHQ9 or GAD7 (anything else goes back to the list) */
export default function AssessmentTake() {
  const { type } = useParams();
  if (!TYPES.includes(type)) return <Navigate to="/app/assessments" replace />;
  return <PlaceholderPage title={NAMES[type]} subtitle="Over the last 2 weeks, how often have you been bothered by the following?" disclaimer />;
}
