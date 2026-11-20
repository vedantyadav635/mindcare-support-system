/** StatTile: a small coloured tile with an icon, a title, one big value and a detail line (summaries, results). */
import { Card } from "./ui";

export default function StatTile({ tint, icon, title, value, detail }) {
  return (
    <Card tint={tint} padding="none" className="flex items-center gap-4 p-4 sm:flex-col sm:gap-2 sm:p-5 sm:text-center">
      <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-surface text-2xl shadow-soft">{icon}</span>
      <div className="min-w-0">
        <p className="text-small font-semibold text-ink-700">{title}</p>
        <p className="font-heading text-h3 font-extrabold text-ink-900">{value}</p>
        {detail && <p className="text-small text-ink-700">{detail}</p>}
      </div>
    </Card>
  );
}
