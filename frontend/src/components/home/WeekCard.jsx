/** "Your week" card: a 7-day mood sparkline from the dashboard's trend data. */
import { Link } from "react-router-dom";
import { Button, Card } from "../ui";
import { hasValue, moodWord, toRows } from "../charts/chartData";
import MoodSparkline from "../charts/MoodSparkline";

export default function WeekCard({ trend, className }) {
  const rows = toRows("week", trend);
  const moods = rows.map((r) => r.mood).filter(hasValue);
  const average = moods.length ? moods.reduce((sum, m) => sum + m, 0) / moods.length : null;

  return (
    <Card className={className}>
      <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
        <h2 className="text-h3">Your week</h2>
        <Button as={Link} to="/app/trends" variant="ghost" size="sm">See trends</Button>
      </div>

      {moods.length >= 2 ? (
        <>
          <div aria-hidden="true"><MoodSparkline rows={rows} /></div>
          {/* Screen readers get a sentence instead of the picture */}
          <p className="text-ink-700">
            Mood this week: <strong className="text-ink-900">{moodWord(average)}</strong> ({average.toFixed(1)} out of 5 on average,
            from {moods.length} check-ins).
          </p>
        </>
      ) : (
        <p className="py-8 text-ink-700">
          Your mood line will appear here after a couple of check-ins this week.
        </p>
      )}
    </Card>
  );
}
