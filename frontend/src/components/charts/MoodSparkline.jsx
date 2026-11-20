/** A tiny 7-day mood line for the home page. Days without a check-in are gaps. */
import { Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MOOD_LABELS } from "../checkin/mood";
import ChartTooltip from "./ChartTooltip";
import { COLORS } from "./chartData";

const describe = (_, value) => `${MOOD_LABELS[Math.round(value)]} (${value} of 5)`;

export default function MoodSparkline({ rows }) {
  return (
    <ResponsiveContainer width="100%" height={110}>
      <LineChart data={rows} margin={{ top: 10, right: 12, left: 12, bottom: 0 }} accessibilityLayer={false}>
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={{ fill: COLORS.text, fontSize: 12 }} tickMargin={6} interval={0} />
        <YAxis domain={[1, 5]} hide />
        <Tooltip content={<ChartTooltip describe={describe} />} cursor={false} />
        <Line
          dataKey="mood"
          name="Mood"
          type="monotone"
          stroke={COLORS.mood}
          strokeWidth={4}
          strokeLinecap="round"
          connectNulls={false}
          dot={{ r: 4, stroke: COLORS.mood, strokeWidth: 3, fill: COLORS.surface }}
          activeDot={{ r: 6, stroke: COLORS.mood, strokeWidth: 3, fill: COLORS.surface }}
        />
      </LineChart>
    </ResponsiveContainer>
  );
}
