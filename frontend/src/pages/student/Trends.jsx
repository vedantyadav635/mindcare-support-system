/** /app/trends: week or month of mood, stress and sleep, with summary tiles, charts and plain-language insights. */
import { Flame, Moon, Wind } from "lucide-react";
import { useCallback, useState } from "react";
import { Link } from "react-router-dom";
import * as wellbeingApi from "../../api/wellbeing";
import ChartFrame from "../../components/charts/ChartFrame";
import { moodStressInsight, moodWord, sleepInsight, stressWord, toRows, hasValue } from "../../components/charts/chartData";
import MoodStressChart from "../../components/charts/MoodStressChart";
import SleepChart from "../../components/charts/SleepChart";
import { MOOD_EMOJI, MOOD_LABELS } from "../../components/checkin/mood";
import ErrorNotice from "../../components/ErrorNotice";
import StatTile from "../../components/StatTile";
import { Button, EmptyState, PageHeader, SegmentedControl, Spinner } from "../../components/ui";
import useApi from "../../hooks/useApi";

const PERIODS = [
  { value: "week", label: "Week" },
  { value: "month", label: "Month" },
];

export default function Trends() {
  const [period, setPeriod] = useState("week");
  return (
    <div>
      <PageHeader
        title="Your trends"
        subtitle="How your mood, stress and sleep have been."
        action={<SegmentedControl label="Time period" options={PERIODS} value={period} onChange={setPeriod} />}
      />
      {/* key = period: switching shows the loading spinner and loads fresh data */}
      <TrendsView key={period} period={period} />
    </div>
  );
}

function TrendsView({ period }) {
  const load = useCallback(() => wellbeingApi.trends(period), [period]);
  const { data, error, loading, reload } = useApi(load);

  if (loading) return <div className="flex justify-center py-24 text-brand-500"><Spinner size="lg" label="Loading your trends" /></div>;
  if (error) {
    return (
      <div className="mx-auto max-w-md space-y-4 py-12 text-center">
        <ErrorNotice>{error}</ErrorNotice>
        <Button onClick={reload}>Try again</Button>
      </div>
    );
  }

  const { points, summary } = data;

  // Fewer than 2 check-ins: not enough to draw a pattern yet
  if (summary.entries_count < 2) {
    return (
      <EmptyState
        title="Your trends will appear here"
        text="After two check-ins we can start showing your patterns. It only takes a minute."
        action={<Button as={Link} to="/app/checkin">Check in now</Button>}
      />
    );
  }

  const rows = toRows(period, points);
  const { avg_mood: mood, avg_stress: stress, avg_sleep: sleep, streak_days: streak } = summary;
  const roundedMood = hasValue(mood) ? Math.round(mood) : null;

  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <StatTile
          tint="sun"
          icon={roundedMood ? MOOD_EMOJI[roundedMood] : "🙂"}
          title="Average mood"
          value={hasValue(mood) ? `${mood.toFixed(1)} / 5` : "—"}
          detail={hasValue(mood) ? `${MOOD_LABELS[roundedMood]}, ${moodWord(mood)}` : "Not answered yet"}
        />
        <StatTile
          tint="lilac"
          icon={<Wind className="size-6 text-ink-900" />}
          title="Average stress"
          value={hasValue(stress) ? `${stress.toFixed(1)} / 5` : "—"}
          detail={hasValue(stress) ? `Stress is ${stressWord(stress)}` : "Not answered yet"}
        />
        <StatTile
          tint="sky"
          icon={<Moon className="size-6 text-ink-900" />}
          title="Average sleep"
          value={hasValue(sleep) ? `${sleep.toFixed(1)} h` : "—"}
          detail={hasValue(sleep) ? "per night" : "Not answered yet"}
        />
        <StatTile
          tint="peach"
          icon={<Flame className="size-6 text-ink-900" />}
          title="Check-in streak"
          value={`${streak} ${streak === 1 ? "day" : "days"}`}
          detail={streak > 0 ? "in a row" : "Check in today to start one"}
        />
      </div>

      <ChartFrame
        title="Mood and stress"
        insight={moodStressInsight(mood, stress)}
        rows={rows}
        columns={[["mood", "Mood (1 to 5)"], ["stress", "Stress (1 to 5)"]]}
      >
        <MoodStressChart rows={rows} />
      </ChartFrame>

      <ChartFrame title="Sleep" insight={sleepInsight(sleep)} rows={rows} columns={[["sleep", "Sleep (hours)"]]}>
        <SleepChart rows={rows} />
      </ChartFrame>
    </div>
  );
}
