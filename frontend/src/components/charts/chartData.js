/**
 * Chart colours (our design tokens, as CSS variables) and the pure logic behind the charts:
 * turning API points into rows, and writing the short plain-language insight lines.
 */
import { dayMonth, fullDay, weekdayShort } from "../../utils/format";

export const COLORS = {
  mood: "var(--color-brand-500)",
  stress: "var(--color-lilac)",
  sleep: "var(--color-sky)",
  grid: "var(--color-line)",
  text: "var(--color-ink-700)",
  surface: "var(--color-surface)",
};

export const SLEEP_TARGET_HOURS = 7;

export const hasValue = (value) => value !== null && value !== undefined;

/**
 * API points -> chart rows {label, full, mood, stress, sleep}. Missing values stay null, so the
 * charts show gaps instead of zeros.
 *   week:  [{date, mood, stress, sleep_hours}]
 *   month: [{week_start, avg_mood, avg_stress, avg_sleep}]
 */
export function toRows(period, points) {
  if (period === "week") {
    return points.map((p) => ({ label: weekdayShort(p.date), full: fullDay(p.date), mood: p.mood, stress: p.stress, sleep: p.sleep_hours }));
  }
  return points.map((p) => ({
    label: dayMonth(p.week_start),
    full: `Week of ${dayMonth(p.week_start)}`,
    mood: p.avg_mood,
    stress: p.avg_stress,
    sleep: p.avg_sleep,
  }));
}

// ---------- Words for the numbers ----------

export const moodWord = (average) => (average >= 4 ? "mostly good" : average >= 3 ? "around okay" : "on the lower side");
export const stressWord = (average) => (average >= 4 ? "high" : average >= 3 ? "moderate" : "fairly low");

const oneDecimal = (n) => n.toFixed(1);

/** Insight under the mood/stress chart. Gentle and never diagnostic. */
export function moodStressInsight(averageMood, averageStress) {
  if (!hasValue(averageMood) && !hasValue(averageStress)) {
    return "Answer the mood and stress questions in your check-in to see this.";
  }
  const sentences = [];
  if (hasValue(averageMood)) sentences.push(`Your mood averaged ${oneDecimal(averageMood)} out of 5, ${moodWord(averageMood)}.`);
  if (hasValue(averageStress)) sentences.push(`Your stress averaged ${oneDecimal(averageStress)} out of 5, which is ${stressWord(averageStress)}.`);
  if ((hasValue(averageMood) && averageMood < 3) || (hasValue(averageStress) && averageStress >= 4)) {
    sentences.push("Be gentle with yourself. Talking to someone can help.");
  }
  return sentences.join(" ");
}

/** Insight under the sleep chart. */
export function sleepInsight(averageHours) {
  if (!hasValue(averageHours)) return "Answer the sleep question in your check-in to see this.";
  const phrase =
    averageHours < 5 ? "well under the 7 to 9 hours most people need"
    : averageHours < SLEEP_TARGET_HOURS ? "a bit under the 7 to 9 hours most people need"
    : averageHours <= 9 ? "right in the 7 to 9 hours most people need"
    : "a little above the 7 to 9 hours most people need";
  return `Your sleep averaged ${oneDecimal(averageHours)} hours, ${phrase}.`;
}
