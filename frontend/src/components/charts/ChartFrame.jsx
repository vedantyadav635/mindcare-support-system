/**
 * ChartFrame: a card holding one chart, plus a short insight line under it.
 * The chart itself is hidden from screen readers (a picture of numbers isn't useful to them);
 * instead they get the same numbers as a table, and the insight sentence for everyone.
 *
 * <ChartFrame title="Sleep" insight="..." rows={rows} columns={[["sleep", "Sleep (hours)"]]}> <BarChart/> </ChartFrame>
 */
import { Lightbulb } from "lucide-react";
import { Card } from "../ui";
import { hasValue } from "./chartData";

export default function ChartFrame({ title, insight, rows, columns, children }) {
  return (
    <Card>
      <h2 className="mb-4 text-h3">{title}</h2>
      <div aria-hidden="true">{children}</div>

      <table className="sr-only">
        <caption>{title}</caption>
        <thead>
          <tr>
            <th scope="col">Day</th>
            {columns.map(([key, label]) => <th key={key} scope="col">{label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.full}>
              <th scope="row">{row.full}</th>
              {columns.map(([key]) => <td key={key}>{hasValue(row[key]) ? row[key] : "No check-in"}</td>)}
            </tr>
          ))}
        </tbody>
      </table>

      <p className="mt-4 flex items-start gap-2.5 rounded-md bg-sand px-4 py-3 text-ink-900">
        <Lightbulb aria-hidden="true" className="mt-1 size-5 shrink-0 text-brand-700" />
        <span>{insight}</span>
      </p>
    </Card>
  );
}
