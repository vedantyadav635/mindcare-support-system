/**
 * ChartTooltip: the friendly hover/tap box for our charts.
 * Pass `describe(name, value)` to turn a number into words, e.g. "4 of 5 · Good".
 * Recharts supplies active / payload itself when this is used as <Tooltip content={<ChartTooltip describe={...} />} />.
 */
import { hasValue } from "./chartData";

export default function ChartTooltip({ active, payload, describe }) {
  if (!active || !payload?.length) return null;
  const row = payload[0].payload;
  const entries = payload.filter((item) => hasValue(item.value));

  return (
    <div className="rounded-md bg-surface px-4 py-3 shadow-lift ring-1 ring-line">
      <p className="font-heading text-small font-bold text-ink-900">{row.full}</p>
      {entries.length === 0 ? (
        <p className="mt-1 text-small text-ink-700">No check-in</p>
      ) : (
        <ul className="mt-1 space-y-0.5">
          {entries.map((item) => (
            <li key={item.dataKey} className="flex items-center gap-2 text-small text-ink-700">
              <span aria-hidden="true" className="size-2.5 rounded-pill" style={{ backgroundColor: item.color }} />
              <span>{item.name}: <strong className="text-ink-900">{describe(item.name, item.value)}</strong></span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
