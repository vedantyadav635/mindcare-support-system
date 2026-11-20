/**
 * GroundingExercise: the 5-4-3-2-1 exercise, one calm step at a time (about a minute).
 * It gently brings attention back to the present using the senses. No timers: the person moves on when ready.
 */
import { useState } from "react";
import { Button, Card } from "../ui";

const STEPS = [
  { count: 5, sense: "see", prompt: "Look around and name 5 things you can see." },
  { count: 4, sense: "feel", prompt: "Notice 4 things you can feel, like your feet on the floor or your clothes on your skin." },
  { count: 3, sense: "hear", prompt: "Listen for 3 things you can hear, near or far." },
  { count: 2, sense: "smell", prompt: "Find 2 things you can smell, or think of 2 smells you like." },
  { count: 1, sense: "taste", prompt: "Notice 1 thing you can taste, or take a slow sip of water." },
];

export default function GroundingExercise() {
  const [step, setStep] = useState(-1); // -1 = not started, STEPS.length = finished
  const current = STEPS[step];

  return (
    <Card tint="sand" as="section" aria-labelledby="grounding-title">
      <h2 id="grounding-title" className="text-h3">A one-minute grounding exercise</h2>
      <p className="mt-1 text-ink-700">When everything feels too much, this can help you feel a little steadier.</p>

      <div aria-live="polite" className="mt-6 rounded-md bg-surface p-5 text-center">
        {step === -1 && <p className="text-ink-900">Take one slow breath in, and a long breath out. Then start when you're ready.</p>}
        {current && (
          <>
            <p className="font-heading text-display-sm font-extrabold text-ink-900">{current.count}</p>
            <p className="mt-1 font-heading font-bold text-ink-900">things you can {current.sense}</p>
            <p className="mt-3 text-ink-700">{current.prompt}</p>
            <p className="mt-3 text-small text-ink-700">Step {step + 1} of {STEPS.length}</p>
          </>
        )}
        {step === STEPS.length && (
          <p className="text-ink-900">Well done. Take one more slow breath. If you still feel unsafe, please call one of the numbers above.</p>
        )}
      </div>

      <div className="mt-4 flex flex-wrap justify-center gap-3">
        {step === -1 && <Button onClick={() => setStep(0)}>Start</Button>}
        {current && (
          <>
            {step > 0 && <Button variant="secondary" onClick={() => setStep(step - 1)}>Back</Button>}
            <Button onClick={() => setStep(step + 1)}>{step === STEPS.length - 1 ? "Finish" : "Next"}</Button>
          </>
        )}
        {step === STEPS.length && <Button variant="secondary" onClick={() => setStep(0)}>Do it again</Button>}
      </div>
    </Card>
  );
}
