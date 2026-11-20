/** Last screen before sending: every question with the answer, and an Edit button for each. */
import { CircleAlert, Pencil } from "lucide-react";
import { Button, Card } from "../ui";

/** The answer as text for the review list, or null if there is none. */
export function answerText(question, value) {
  if (value === undefined || value === "") return null;
  if (question.answer_type === "option") return question.options.find((o) => o.value === value)?.label ?? null;
  return value.trim() || null;
}

export default function ReviewStep({ questions, answers, onEdit }) {
  return (
    <div>
      <h2 className="font-heading text-h2 font-extrabold text-ink-900 md:text-h1">Take a quick look</h2>
      <p className="mb-6 mt-2 text-ink-700">Everything look right? You can change any answer.</p>
      <ul className="space-y-3">
        {questions.map((question, index) => {
          const text = answerText(question, answers[question.id]);
          return (
            <li key={question.id}>
              <Card padding="md" className="flex items-start gap-4">
                <div className="min-w-0 flex-1">
                  <p className="text-small text-ink-700">{question.text}</p>
                  {text ? (
                    <p className="mt-1 whitespace-pre-wrap break-words font-bold text-ink-900">{text}</p>
                  ) : question.is_required ? (
                    <p className="mt-1 flex items-center gap-1.5 font-bold text-ink-900">
                      <CircleAlert aria-hidden="true" className="size-4 text-danger" /> Needs an answer
                    </p>
                  ) : (
                    <p className="mt-1 text-ink-700">Skipped</p>
                  )}
                </div>
                <Button variant="ghost" size="sm" onClick={() => onEdit(index)} aria-label={`Edit your answer to: ${question.text}`}>
                  <Pencil aria-hidden="true" className="size-4" /> Edit
                </Button>
              </Card>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
