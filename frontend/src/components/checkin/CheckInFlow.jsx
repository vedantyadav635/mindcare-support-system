/**
 * The check-in conversation: one question per screen, then a review, then send.
 *
 * Privacy: answers live only in this component's state (memory). They are never written to
 * localStorage, sessionStorage or the URL.
 *
 * Steps: 0 .. questions.length - 1 are the questions; questions.length is the review screen.
 */
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as checkinApi from "../../api/checkin";
import ErrorNotice from "../ErrorNotice";
import ProgressDots from "../ProgressDots";
import { Button, SectionBlob } from "../ui";
import CheckInDone from "./CheckInDone";
import QuestionStep from "./QuestionStep";
import ReviewStep from "./ReviewStep";

const ADVANCE_DELAY_MS = 350; // short pause after tapping an option, so the choice is seen before moving on

/** Start from today's saved answers (when editing). Answers to questions that no longer exist are dropped. */
function prefill(questions, todayEntry) {
  const answers = {};
  const known = new Set(questions.map((q) => q.id));
  for (const a of todayEntry?.answers ?? []) {
    if (!known.has(a.question_id)) continue;
    const value = a.option_value ?? a.text_answer;
    if (value !== null && value !== undefined) answers[a.question_id] = value;
  }
  return answers;
}

const isAnswered = (question, answers) => {
  const value = answers[question.id];
  return value !== undefined && (typeof value !== "string" || value.trim() !== "");
};

export default function CheckInFlow({ questions, todayEntry }) {
  const navigate = useNavigate();
  const updating = Boolean(todayEntry);

  const [answers, setAnswers] = useState(() => prefill(questions, todayEntry)); // { questionId: option value or text }
  const [step, setStep] = useState(0);
  const [fromReview, setFromReview] = useState(false); // true while fixing one answer from the review screen
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);

  const total = questions.length;
  const reviewing = step === total;
  const question = questions[step];
  const container = useRef(null);
  const timer = useRef(null);

  const clearTimer = () => clearTimeout(timer.current);
  useEffect(() => clearTimer, []); // cancel a pending auto-advance if we leave the page

  // Move keyboard focus into the new screen: the chosen (or first) option, or the text box on devices with a mouse
  useEffect(() => {
    const root = container.current;
    if (!root) return;
    const radio = root.querySelector('input[type="radio"]:checked') ?? root.querySelector('input[type="radio"]');
    if (radio) radio.focus({ preventScroll: true });
    else if (window.matchMedia("(pointer: fine)").matches) root.querySelector("textarea")?.focus({ preventScroll: true });
  }, [step]);

  // ---------- Moving around ----------

  function go(next) {
    clearTimer();
    setStep(next);
  }

  function next() {
    if (fromReview) {
      setFromReview(false);
      go(total); // back to the review after fixing one answer
    } else {
      go(step + 1);
    }
  }

  function back() {
    if (fromReview) {
      setFromReview(false);
      go(total);
    } else {
      go(step - 1);
    }
  }

  function edit(index) {
    setFromReview(true);
    go(index);
  }

  function setAnswer(value) {
    setAnswers((current) => ({ ...current, [question.id]: value }));
  }

  /** Tapped an option: select it, then move on after a short pause. */
  function pick(value) {
    setAnswer(value);
    clearTimer();
    timer.current = setTimeout(next, ADVANCE_DELAY_MS);
  }

  const answered = question ? isAnswered(question, answers) : false;
  const canGoNext = answered || !question?.is_required;
  const missingRequired = questions.some((q) => q.is_required && !isAnswered(q, answers));

  // ---------- Sending ----------

  async function submit() {
    setBusy(true);
    setError("");
    const body = questions
      .filter((q) => isAnswered(q, answers))
      .map((q) =>
        q.answer_type === "option"
          ? { question_id: q.id, option_value: answers[q.id] }
          : { question_id: q.id, text_answer: answers[q.id].trim() },
      );
    try {
      const response = await checkinApi.submit(body);
      if (response.crisis) {
        // Straight to the crisis screen, carrying the helpline info from the response
        navigate("/app/help", { replace: true, state: { crisisResponse: response.crisis_response } });
        return;
      }
      setResult(response);
    } catch (e) {
      setError(e.message);
    }
    setBusy(false);
  }

  if (result) return <CheckInDone result={result} questions={questions} updated={updating} />;

  const eyebrow = reviewing ? "Review" : `Question ${step + 1} of ${total}`;
  const finalLabel = updating ? "Update today's check-in" : "Send my check-in";

  return (
    <div className="relative mx-auto max-w-2xl py-2">
      <h1 className="sr-only">Daily check-in</h1>
      {/* The blob is clipped by this box, so it can never make the page scroll sideways */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <SectionBlob shape="blob" color="sun" className="absolute -right-20 -top-16 size-56 opacity-40" />
      </div>

      <ProgressDots label="Check-in progress" total={total} current={reviewing ? total + 1 : step + 1} valueText={eyebrow} />
      <p aria-live="polite" className="mt-5 text-center text-small font-semibold text-ink-700">
        {updating && "Updating today's check-in · "}
        {eyebrow}
      </p>

      {/* key = step: each screen fades in. container is used to move focus. */}
      <div key={step} ref={container} className="mt-6 animate-fade-up">
        {reviewing ? (
          <ReviewStep questions={questions} answers={answers} onEdit={edit} />
        ) : (
          <QuestionStep question={question} value={answers[question.id]} onChange={setAnswer} onPick={pick} onEnter={() => canGoNext && next()} />
        )}
      </div>

      {reviewing && <div className="mt-6"><ErrorNotice>{error}</ErrorNotice></div>}

      <div className="mt-8 flex items-center justify-between gap-3">
        <Button variant="secondary" onClick={back} disabled={step === 0 && !fromReview}>
          <ArrowLeft aria-hidden="true" className="size-5" /> Back
        </Button>

        {reviewing ? (
          <Button onClick={submit} loading={busy} disabled={missingRequired}>{finalLabel}</Button>
        ) : (
          <div className="flex items-center gap-4">
            {!question.is_required && !answered && (
              <button type="button" onClick={next} className="rounded-pill px-2 py-1 font-semibold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4 hover:bg-sand">
                Skip
              </button>
            )}
            <Button onClick={next} disabled={!canGoNext}>
              {step === total - 1 && !fromReview ? "Review" : fromReview ? "Done" : "Next"}
              <ArrowRight aria-hidden="true" className="size-5" />
            </Button>
          </div>
        )}
      </div>
      {reviewing && missingRequired && <p className="mt-3 text-right text-small text-ink-700">Please answer the required questions first.</p>}
    </div>
  );
}
