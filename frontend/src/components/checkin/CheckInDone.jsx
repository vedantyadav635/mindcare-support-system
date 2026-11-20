/** Cheerful finish screen with today's mood, stress and sleep as three small tiles. */
import { Moon, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import StatTile from "../StatTile";
import { Button, SectionBlob } from "../ui";
import { MOOD_EMOJI } from "./mood";

/** The label the student picked (e.g. "Moderately") for a metric, found in the question's options. */
function labelFor(questions, metric, value) {
  const question = questions.find((q) => q.metric === metric);
  return question?.options?.find((o) => o.value === value)?.label ?? null;
}

export default function CheckInDone({ result, questions, updated }) {
  const { mood, stress, sleep_hours: sleep } = result;
  const none = "—"; // metric not asked or skipped

  return (
    <div className="relative mx-auto max-w-2xl overflow-hidden py-6 text-center">
      <SectionBlob shape="star" color="sun" className="absolute left-2 top-6 size-10" />
      <SectionBlob shape="arc" color="mint" className="absolute -right-4 top-20 size-24" />
      <SectionBlob shape="smile" color="orange" float className="relative mx-auto mb-6 size-28" />
      <h1>Thanks for checking in</h1>
      <p className="mx-auto mt-3 max-w-md text-ink-700">
        {updated ? "Your check-in for today is updated." : "Noticing how you feel is a small act of care."} Here's how today looks.
      </p>

      <div className="mt-8 grid gap-3 text-left sm:grid-cols-3">
        <StatTile
          tint="sun"
          icon={mood ? MOOD_EMOJI[mood] : "🙂"}
          title="Mood"
          value={mood ? labelFor(questions, "mood", mood) ?? `${mood} of 5` : none}
          detail={mood ? `${mood} of 5` : "Not answered"}
        />
        <StatTile
          tint="lilac"
          icon={<Wind className="size-6 text-ink-900" />}
          title="Stress"
          value={stress ? labelFor(questions, "stress", stress) ?? `${stress} of 5` : none}
          detail={stress ? `${stress} of 5` : "Not answered"}
        />
        <StatTile
          tint="sky"
          icon={<Moon className="size-6 text-ink-900" />}
          title="Sleep"
          value={sleep !== null ? `${sleep} hours` : none}
          detail={sleep !== null ? labelFor(questions, "sleep", sleep) : "Not answered"}
        />
      </div>

      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button as={Link} to="/app/trends" size="lg">See my trends</Button>
        <Button as={Link} to="/app/resources" variant="secondary" size="lg">Get suggestions</Button>
      </div>
    </div>
  );
}
