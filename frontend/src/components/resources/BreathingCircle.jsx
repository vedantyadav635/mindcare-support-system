/**
 * BreathingCircle: a guided breathing animation. The circle grows while you breathe in, stays while
 * you hold, and shrinks while you breathe out. A countdown and the words guide you too.
 *
 * Accessibility:
 *   - prefers-reduced-motion: the circle does not move; the words and countdown do the guiding.
 *   - a Pause button (moving content that lasts longer than 5 seconds must be pausable).
 *   - the instruction ("Breathe in") is announced politely; the countdown is not read out.
 */
import { Pause, Play } from "lucide-react";
import { useEffect, useState } from "react";
import usePrefersReducedMotion from "../../hooks/usePrefersReducedMotion";
import { Button } from "../ui";

const READY_SECONDS = 2;
const GROWN = 1.5; // how much bigger the circle gets while "full of air"

// Each step: instruction, seconds, and whether the circle is big (full) or small (empty) during it
const IN = { label: "Breathe in", seconds: 4, full: true };
const OUT = { label: "Breathe out", seconds: 4, full: false };

export const PATTERNS = {
  simple: [IN, { label: "Hold", seconds: 4, full: true }, OUT],
  box: [IN, { label: "Hold", seconds: 4, full: true }, OUT, { label: "Hold", seconds: 4, full: false }],
  "4-7-8": [IN, { label: "Hold", seconds: 7, full: true }, { label: "Breathe out", seconds: 8, full: false }],
};

/** Pick the pattern that matches the resource, so the animation agrees with its text. */
export function patternFor(title) {
  const text = title.toLowerCase();
  if (text.includes("4-7-8")) return PATTERNS["4-7-8"];
  if (text.includes("box")) return PATTERNS.box;
  return PATTERNS.simple;
}

/** One second passes: count down, and when the countdown ends move to the next step (looping forever). */
export function advance({ phase, left }, phases) {
  if (left > 1) return { phase, left: left - 1 };
  const next = (phase + 1) % phases.length; // from "Get ready" (-1) this gives step 0
  return { phase: next, left: phases[next].seconds };
}

export default function BreathingCircle({ phases }) {
  const reducedMotion = usePrefersReducedMotion();
  const [paused, setPaused] = useState(false);
  // phase -1 is a short "Get ready", so the first breath in starts from a small circle
  const [state, setState] = useState({ phase: -1, left: READY_SECONDS });

  // Tick once a second; when the countdown reaches 0, move to the next step
  useEffect(() => {
    if (paused) return;
    const timer = setInterval(() => setState((current) => advance(current, phases)), 1000);
    return () => clearInterval(timer);
  }, [paused, phases]);

  const current = state.phase === -1 ? { label: "Get ready", seconds: READY_SECONDS, full: false } : phases[state.phase];
  const scale = !reducedMotion && current.full ? GROWN : 1;

  return (
    <div className="mb-6 rounded-lg bg-sky/20 px-4 py-6 text-center">
      <div aria-hidden="true" className="flex h-60 items-center justify-center">
        <div className="relative flex size-32 items-center justify-center">
          <span className="absolute -inset-4 rounded-pill bg-lilac/30" />
          <span
            className="flex size-32 items-center justify-center rounded-pill bg-sky shadow-lift ease-in-out"
            style={{ transform: `scale(${scale})`, transition: `transform ${current.seconds}s ease-in-out` }}
          />
          <span className="absolute font-heading text-h1 font-extrabold text-ink-900">{state.left}</span>
        </div>
      </div>

      <p aria-live="polite" className="font-heading text-h3 font-extrabold text-ink-900">{paused ? "Paused" : current.label}</p>
      {reducedMotion && (
        <p className="mx-auto mt-2 max-w-xs text-small text-ink-700">
          Movement is off because your device asks for less motion. Follow the words and the numbers.
        </p>
      )}
      <Button variant="secondary" size="sm" onClick={() => setPaused(!paused)} className="mt-4">
        {paused ? <Play aria-hidden="true" className="size-4" /> : <Pause aria-hidden="true" className="size-4" />}
        {paused ? "Resume" : "Pause"}
      </Button>
    </div>
  );
}
