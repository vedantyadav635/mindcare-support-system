/** /app/assessments: the two self-checks, a clear "not a diagnosis" note, and past results. */
import { Clock } from "lucide-react";
import { Link } from "react-router-dom";
import * as assessmentsApi from "../../api/assessments";
import { ASSESSMENTS, bandInfo, COMPLETION_TIME, SCREENING_NOTE } from "../../components/assessments/assessmentInfo";
import ErrorNotice from "../../components/ErrorNotice";
import { Badge, Button, Card, Disclaimer, EmptyState, PageHeader, Spinner } from "../../components/ui";
import useApi from "../../hooks/useApi";
import { formatDate } from "../../utils/format";

export default function Assessments() {
  const history = useApi(assessmentsApi.history);

  return (
    <div>
      <PageHeader title="Self-check" subtitle="Short, well-known questionnaires about the last two weeks. They help you reflect." />

      {/* Shown before anything can be started */}
      <Disclaimer className="mb-8">{history.data?.disclaimer ?? SCREENING_NOTE}</Disclaimer>

      <ul className="grid gap-6 md:grid-cols-2">
        {assessmentsApi.TYPES.map((type) => {
          const info = ASSESSMENTS[type];
          const Icon = info.icon;
          return (
            <li key={type}>
              <Card tint={info.tint} hover className="flex h-full flex-col">
                <span aria-hidden="true" className="mb-4 flex size-12 items-center justify-center rounded-pill bg-surface shadow-soft">
                  <Icon className="size-6 text-ink-900" />
                </span>
                <h2>{info.name}</h2>
                <p className="mt-1 flex items-center gap-1.5 text-small font-semibold text-ink-900">
                  <Clock aria-hidden="true" className="size-4" /> {COMPLETION_TIME} · {info.questions} questions
                </p>
                <p className="mt-3 flex-1 text-ink-700">{info.about}</p>
                <Button as={Link} to={`/app/assessments/${type}`} className="mt-6 self-start">Start the {info.name.toLowerCase()}</Button>
              </Card>
            </li>
          );
        })}
      </ul>

      <h2 className="mb-4 mt-14">Your past results</h2>
      {history.loading ? (
        <div className="flex justify-center py-10 text-brand-500"><Spinner label="Loading your results" /></div>
      ) : history.error ? (
        <div className="max-w-md space-y-4">
          <ErrorNotice>{history.error}</ErrorNotice>
          <Button variant="secondary" onClick={history.reload}>Try again</Button>
        </div>
      ) : history.data.results.length === 0 ? (
        <EmptyState title="No self-checks yet" text="When you finish one, your result will be saved here, just for you." />
      ) : (
        <ul className="space-y-3">
          {history.data.results.map((result) => {
            const info = ASSESSMENTS[result.type];
            const band = bandInfo(result.severity_band);
            return (
              <li key={result.id}>
                <Card padding="md" className="flex flex-wrap items-center gap-x-6 gap-y-2">
                  <span className="min-w-36 flex-1 font-heading font-bold text-ink-900">{info.name}</span>
                  <span className="text-ink-700">{formatDate(result.created_at)}</span>
                  <span className="text-ink-700">{result.total_score} of {info.maxScore}</span>
                  <Badge status={band.badge}>{band.label}</Badge>
                </Card>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}
