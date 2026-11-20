/**
 * Shown in place of a normal bot bubble when the reply is a crisis response: the caring message,
 * tap-to-call buttons right there, and a link to the full help page. Highlighted, but calm (no red).
 */
import { HeartHandshake } from "lucide-react";
import { Link } from "react-router-dom";
import CallButtons from "../crisis/CallButtons";
import { callOptions } from "../crisis/helplines";
import { Button } from "../ui";

export default function CrisisCard({ response }) {
  const { options, campusText } = callOptions(response);
  return (
    <div role="alert" className="w-full rounded-lg border-2 border-brand-300 bg-brand-50 p-5 shadow-soft">
      <p className="flex items-center gap-2 font-heading text-h3 font-extrabold text-ink-900">
        <HeartHandshake aria-hidden="true" className="size-6 shrink-0" /> Please reach out now
      </p>
      <p className="mt-2 whitespace-pre-wrap text-ink-900">{response.message}</p>
      <div className="mt-4"><CallButtons options={options} size="sm" /></div>
      {campusText && <p className="mt-3 text-small text-ink-700"><strong className="text-ink-900">Campus counsellor:</strong> {campusText}</p>}
      <Button as={Link} to="/app/help" state={{ crisisResponse: response }} variant="secondary" size="sm" className="mt-4">
        Open the help page
      </Button>
    </div>
  );
}
