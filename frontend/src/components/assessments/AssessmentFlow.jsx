/**
 * One self-check: an intro with the screening note, then one question per screen, then the result.
 *
 * Privacy: answers live only in this component's state (memory), never in browser storage.
 * Screens: step 0 = intro, steps 1..n = questions.
 */
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as assessmentsApi from "../../api/assessments";
import ErrorNotice from "../ErrorNotice";
import ProgressDots from "../ProgressDots";
import { Button, Card, Disclaimer, OptionCard } from "../ui";
import { ASSESSMENTS, COMPLETION_TIME } from "./assessmentInfo";
import AssessmentResult from "./AssessmentResult";

/** One question with its four answer options. Arrow keys choose, Enter goes on. */
export function QuestionScreen({ data, question, value, onChange, onEnter }) {
  return (
    <fieldset onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), onEnter())}>
      <p className="mb-3 text-small font-semibold text-ink-700">{data.stem}</p>
      <legend className="mb-6 font-heading text-h2 font-extrabold text-ink-900 md:text-h1">{question.text}</legend>
      <div className="grid gap-3 sm:grid-cols-2">
        {data.options.map((option) => (
          <OptionCard
            key={option.value}
            name={`question-${question.number}`}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            label={option.label}
          />
        ))}
      </div>
    </fieldset>
  );
}

export default function AssessmentFlow({ type, data }) {
  const navigate = useNavigate();
  const info = ASSESSMENTS[type];
  const total = data.questions.length;

  const [step, setStep] = useState(0); // 0 = intro
  const [answers, setAnswers] = useState([]); // answers[i] = 0..3 for question i
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const container = useRef(null);

  // Move keyboard focus to the chosen (or first) option on each question screen
  useEffect(() => {
    const root = container.current;
    const radio = root?.querySelector('input[type="radio"]:checked') ?? root?.querySelector('input[type="radio"]');
    radio?.focus({ preventScroll: true });
  }, [step]);

  if (result) return <AssessmentResult result={result} />;

  const disclaimer = data.disclaimer; // from the backend: shown on every screen of the self-check

  // ---------- Intro ----------
  if (step === 0) {
    return (
      <div className="mx-auto max-w-2xl">
        <Card tint={info.tint} className="text-center">
          <h1>{info.name}</h1>
          <p className="mt-3 text-ink-900">{COMPLETION_TIME} · {total} questions</p>
          <p className="mx-auto mt-4 max-w-md text-ink-700">{data.stem}</p>
        </Card>
        <Disclaimer className="mt-6">{disclaimer}</Disclaimer>
        <p className="mt-4 text-ink-700">There are no right or wrong answers. Choose what fits you best, and you can stop at any time.</p>
        <div className="mt-8 flex items-center justify-between gap-3">
          <Button as={Link} to="/app/assessments" variant="secondary"><ArrowLeft aria-hidden="true" className="size-5" /> Back</Button>
          <Button onClick={() => setStep(1)}>Start <ArrowRight aria-hidden="true" className="size-5" /></Button>
        </div>
      </div>
    );
  }

  // ---------- Questions ----------
  const index = step - 1;
  const question = data.questions[index];
  const value = answers[index];
  const answered = value !== undefined;
  const isLast = step === total;

  const choose = (option) => setAnswers((current) => Object.assign([...current], { [index]: option }));

  async function submit() {
    setBusy(true);
    setError("");
    try {
      const response = await assessmentsApi.submit(type, answers);
      if (response.crisis) {
        // Straight to the crisis screen with the helpline info from the response
        navigate("/app/help", { replace: true, state: { crisisResponse: response.crisis_response } });
        return;
      }
      setResult(response);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  const next = () => (isLast ? submit() : setStep(step + 1));

  return (
    <div className="mx-auto max-w-2xl py-2">
      <h1 className="sr-only">{info.name}</h1>
      <ProgressDots label={`${info.name} progress`} total={total} current={step} valueText={`Question ${step} of ${total}`} />
      <p aria-live="polite" className="mt-5 text-center text-small font-semibold text-ink-700">Question {step} of {total}</p>

      <div key={step} ref={container} className="mt-6 animate-fade-up">
        <QuestionScreen data={data} question={question} value={value} onChange={choose} onEnter={() => answered && !busy && next()} />
      </div>

      <div className="mt-6"><ErrorNotice>{error}</ErrorNotice></div>

      <div className="mt-6 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={() => setStep(step - 1)} disabled={busy}>
          <ArrowLeft aria-hidden="true" className="size-5" /> Back
        </Button>
        <Button onClick={next} disabled={!answered} loading={busy}>
          {isLast ? "See my result" : "Next"}
          {!isLast && <ArrowRight aria-hidden="true" className="size-5" />}
        </Button>
      </div>

      <Disclaimer className="mt-8">{disclaimer}</Disclaimer>
    </div>
  );
}
