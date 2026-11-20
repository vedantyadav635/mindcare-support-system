/**
 * Appointments by status: a simple bar chart with the numbers also written out underneath.
 * Counts only. The chart is hidden from screen readers; they get the same numbers as a table.
 */
import { Bar, BarChart, Cell, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import ChartTooltip from "../charts/ChartTooltip";
import { COLORS } from "../charts/chartData";
import { Card, EmptyState } from "../ui";

// status -> label and bar colour (our tokens, as CSS variables)
const STATUSES = [
  { key: "requested", label: "Requested", color: "var(--color-sun)" },
  { key: "confirmed", label: "Confirmed", color: "var(--color-mint)" },
  { key: "completed", label: "Completed", color: "var(--color-sky)" },
  { key: "cancelled", label: "Cancelled", color: "var(--color-blush)" },
];

const AXIS_TICK = { fill: COLORS.text, fontSize: 12 };
const describe = (_, value) => `${value} ${value === 1 ? "appointment" : "appointments"}`;

export default function AppointmentsChart({ counts }) {
  const rows = STATUSES.map(({ key, label, color }) => ({ key, label, full: label, color, count: counts[key] ?? 0 }));
  const total = rows.reduce((sum, row) => sum + row.count, 0);

  return (
    <Card as="section" aria-labelledby="appts-title">
      <h2 id="appts-title" className="mb-4 text-h3">Appointments by status</h2>
      {total === 0 ? (
        <EmptyState title="No appointments yet" text="Once students start booking, the numbers will appear here." />
      ) : (
        <>
          <div aria-hidden="true">
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={rows} margin={{ top: 12, right: 12, left: -20, bottom: 0 }} accessibilityLayer={false}>
                <CartesianGrid strokeDasharray="4 8" stroke={COLORS.grid} vertical={false} />
                <XAxis dataKey="label" tickLine={false} axisLine={false} tick={AXIS_TICK} tickMargin={8} />
                <YAxis allowDecimals={false} tickLine={false} axisLine={false} tick={AXIS_TICK} />
                <Tooltip content={<ChartTooltip describe={describe} />} cursor={{ fill: COLORS.grid, opacity: 0.5 }} />
                <Bar dataKey="count" name="Appointments" radius={[10, 10, 0, 0]} maxBarSize={64}>
                  {rows.map((row) => <Cell key={row.key} fill={row.color} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <table className="sr-only">
            <caption>Appointments by status</caption>
            <thead><tr><th scope="col">Status</th><th scope="col">Appointments</th></tr></thead>
            <tbody>{rows.map((row) => <tr key={row.key}><th scope="row">{row.label}</th><td>{row.count}</td></tr>)}</tbody>
          </table>

          {/* The numbers in words, for everyone */}
          <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {rows.map((row) => (
              <li key={row.key} className="flex items-center gap-2 text-ink-700">
                <span aria-hidden="true" className="size-3 rounded-pill" style={{ backgroundColor: row.color }} />
                {row.label}: <strong className="text-ink-900">{row.count}</strong>
              </li>
            ))}
          </ul>
        </>
      )}
    </Card>
  );
}
