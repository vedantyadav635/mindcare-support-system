/** Mood (orange) and stress (lilac): smooth lines with round dots. A missing day is a gap, never a zero. */
import { CartesianGrid, Legend, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { MOOD_LABELS } from "../checkin/mood";
import ChartTooltip from "./ChartTooltip";
import { COLORS } from "./chartData";

const AXIS_TICK = { fill: COLORS.text, fontSize: 12 };

const describe = (name, value) =>
  name === "Mood" ? `${value.toFixed(1).replace(".0", "")} of 5 · ${MOOD_LABELS[Math.round(value)]}` : `${value.toFixed(1).replace(".0", "")} of 5`;

/** Line props shared by both lines (only the colour and name differ) */
const lineProps = (dataKey, name, color) => ({
  dataKey,
  name,
  type: "monotone",
  stroke: color,
  strokeWidth: 4,
  strokeLinecap: "round",
  connectNulls: false, // gaps for days without a check-in
  dot: { r: 5, stroke: color, strokeWidth: 3, fill: COLORS.surface },
  activeDot: { r: 7, stroke: color, strokeWidth: 3, fill: COLORS.surface },
});

export default function MoodStressChart({ rows }) {
  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={rows} margin={{ top: 12, right: 12, left: -20, bottom: 0 }} accessibilityLayer={false}>
        <CartesianGrid strokeDasharray="4 8" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={8} />
        <YAxis domain={[1, 5]} ticks={[1, 2, 3, 4, 5]} tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <Tooltip content={<ChartTooltip describe={describe} />} cursor={{ stroke: COLORS.grid, strokeWidth: 2 }} />
        <Legend iconType="circle" wrapperStyle={{ paddingTop: 12 }} />
        <Line {...lineProps("mood", "Mood", COLORS.mood)} />
        <Line {...lineProps("stress", "Stress", COLORS.stress)} />
      </LineChart>
    </ResponsiveContainer>
  );
}
