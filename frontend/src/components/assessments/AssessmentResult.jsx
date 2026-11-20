/**
 * The result screen: a soft gauge, the band in plain words, the backend's message, the disclaimer,
 * and (when suggest_counsellor is true) a warm card inviting the student to talk to someone.
 * A crisis result never reaches this screen: the flow sends it to /app/help.
 */
import { Link } from "react-router-dom";
import { Badge, Button, Card, Disclaimer, SectionBlob } from "../ui";
import { ASSESSMENTS, bandInfo } from "./assessmentInfo";
import SemiGauge from "./SemiGauge";

export default function AssessmentResult({ result }) {
  const info = ASSESSMENTS[result.type];
  const band = bandInfo(result.severity_band);

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="sr-only">{info.name}: your result</h1>

      <Card className="relative animate-fade-up overflow-hidden text-center">
        <SectionBlob shape="blob" color="sun" className="absolute -right-10 -top-10 size-40 opacity-40" />
        <SectionBlob shape="arc" color="lilac" className="absolute -bottom-4 -left-4 size-24 opacity-50" />
        <div className="relative">
          <p className="mb-4 font-heading font-bold text-ink-700">{info.name} · {info.short}</p>
          <SemiGauge score={result.total_score} max={info.maxScore} />
          <div className="mt-4"><Badge status={band.badge}>{band.label}</Badge></div>
          <p className="mt-3 font-heading text-h3 font-bold text-ink-900">{band.words}</p>
          <p className="mx-auto mt-4 max-w-md text-ink-700">{result.message}</p>
        </div>
      </Card>

      {result.suggest_counsellor && (
        <Card tint="mint" className="animate-fade-up">
          <h2 className="text-h3">It might help to talk to someone</h2>
          <p className="mt-2 text-ink-700">
            You don't need a big reason. A counsellor can listen, and you can book a private session in a few taps.
          </p>
          <Button as={Link} to="/app/appointments" className="mt-5">Book a counsellor</Button>
        </Card>
      )}

      <Disclaimer>{result.disclaimer}</Disclaimer>

      <div className="flex flex-wrap gap-3">
        <Button as={Link} to="/app/assessments" variant="secondary">Back to self-checks</Button>
        <Button as={Link} to="/app/resources" variant="ghost">See ideas that might help</Button>
      </div>
    </div>
  );
}
