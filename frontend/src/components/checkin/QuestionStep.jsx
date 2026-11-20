/**
 * One check-in question on its own screen.
 *   Option question: big OptionCards. Tapping one selects it and calls onPick (the flow then moves on after a
 *                    short delay). Arrow keys only change the selection; Enter moves on.
 *   Text question:   a TextArea with a character counter. Ctrl+Enter moves on.
 * Answers stay in memory (props); nothing is saved in the browser.
 */
import { useRef } from "react";
import { OptionCard, TextArea } from "../ui";
import { MOOD_EMOJI, MOOD_SWATCH } from "./mood";

const QUESTION_TEXT = "font-heading text-h2 font-extrabold text-ink-900 md:text-h1";

export default function QuestionStep({ question, value, onChange, onPick, onEnter }) {
  // Did the last interaction come from a pointer (mouse/touch)? Only taps auto-advance, so that
  // keyboard users can arrow through the options before choosing.
  const pointer = useRef(false);

  if (question.answer_type === "text") {
    const id = `question-${question.id}`;
    return (
      <div>
        <label htmlFor={id} className={`mb-2 block ${QUESTION_TEXT}`}>{question.text}</label>
        {!question.is_required && <p className="mb-4 text-small text-ink-700">Optional. Skip it if you'd rather not say.</p>}
        <TextArea
          id={id}
          maxLength={question.max_length}
          value={value ?? ""}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={(e) => (e.ctrlKey || e.metaKey) && e.key === "Enter" && onEnter()}
          placeholder="Write as much or as little as you like…"
        />
      </div>
    );
  }

  const isMood = question.metric === "mood";
  return (
    <fieldset
      onPointerDown={() => { pointer.current = true; }}
      onKeyDown={(e) => {
        pointer.current = false;
        if (e.key === "Enter") {
          e.preventDefault();
          onEnter();
        }
      }}
    >
      <legend className={`mb-2 ${QUESTION_TEXT}`}>{question.text}</legend>
      <p className="mb-6 text-small text-ink-700">
        {question.is_required ? "Choose one." : "Optional. Choose one, or skip."}
      </p>
      {/* An odd last card spans both columns, so the grid never looks lopsided */}
      <div className="grid gap-3 sm:grid-cols-2 sm:[&>label:last-child:nth-child(odd)]:col-span-2">
        {question.options.map((option) => (
          <OptionCard
            key={option.value}
            name={`question-${question.id}`}
            value={option.value}
            checked={value === option.value}
            onChange={() => onChange(option.value)}
            onClick={() => pointer.current && onPick(option.value)}
            label={option.label}
            emoji={isMood ? MOOD_EMOJI[option.value] : undefined}
            swatch={isMood ? MOOD_SWATCH[option.value] : undefined}
          />
        ))}
      </div>
    </fieldset>
  );
}
