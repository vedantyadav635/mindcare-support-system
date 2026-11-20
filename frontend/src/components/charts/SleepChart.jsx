/** Sleep hours as sky-blue bars with rounded tops, and a dashed line at 7 hours. No check-in = no bar. */
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "./ChartTooltip";
import { COLORS, SLEEP_TARGET_HOURS } from "./chartData";

const AXIS_TICK = { fill: COLORS.text, fontSize: 12 };

const describe = (_, value) => `${value.toFixed(1).replace(".0", "")} hours`;

export default function SleepChart({ rows }) {
  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={rows} margin={{ top: 12, right: 12, left: -20, bottom: 0 }} accessibilityLayer={false}>
        <CartesianGrid strokeDasharray="4 8" stroke={COLORS.grid} vertical={false} />
        <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={8} />
        <YAxis domain={[0, 12]} ticks={[0, 3, 6, 9, 12]} tickLine={false} axisLine={false} tick={AXIS_TICK} />
        <Tooltip content={<ChartTooltip describe={describe} />} cursor={{ fill: COLORS.grid, opacity: 0.5, radius: 10 }} />
        <ReferenceLine
          y={SLEEP_TARGET_HOURS}
          stroke={COLORS.text}
          strokeDasharray="6 6"
          strokeWidth={2}
          label={{ value: `${SLEEP_TARGET_HOURS} h`, position: "insideTopRight", fill: COLORS.text, fontSize: 12 }}
        />
        <Bar dataKey="sleep" name="Sleep" fill={COLORS.sleep} radius={[10, 10, 0, 0]} maxBarSize={32} />
      </BarChart>
    </ResponsiveContainer>
  );
}
