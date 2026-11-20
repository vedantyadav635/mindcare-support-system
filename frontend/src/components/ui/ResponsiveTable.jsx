import Card from "./Card";
import { cx } from "./cx";

/**
 * ResponsiveTable: a real <table> from tablet width up, and stacked cards on phones.
 *
 * columns: [{ id, header, cell(row), primary?, actions? }]
 *   primary: the main column; on phones it becomes the card's title
 *   actions: buttons column; on phones it sits at the bottom of the card, and its header is hidden visually
 * rows + rowKey(row), and `caption` (describes the table for screen readers).
 *
 * Only one of the two layouts is visible at a time (the other is display:none, so screen readers skip it).
 */
export default function ResponsiveTable({ caption, columns, rows, rowKey, className }) {
  const primary = columns.find((c) => c.primary) ?? columns[0];
  const actions = columns.find((c) => c.actions);
  const details = columns.filter((c) => c !== primary && c !== actions);

  return (
    <div className={className}>
      {/* Tablet and up: a table */}
      <div className="hidden overflow-x-auto rounded-lg bg-surface shadow-soft md:block">
        <table className="w-full text-left">
          <caption className="sr-only">{caption}</caption>
          <thead>
            <tr className="border-b border-line">
              {columns.map((c) => (
                <th key={c.id} scope="col" className="px-5 py-4 font-heading text-small font-bold text-ink-700">
                  <span className={cx(c.actions && "sr-only")}>{c.header}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-b border-line last:border-0">
                {columns.map((c) => (
                  <td key={c.id} className={cx("px-5 py-4 align-middle", c.actions && "text-right")}>{c.cell(row)}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Phones: one card per row */}
      <ul className="space-y-3 md:hidden">
        {rows.map((row) => (
          <li key={rowKey(row)}>
            <Card padding="md">
              <div className="font-heading font-bold text-ink-900">{primary.cell(row)}</div>
              <dl className="mt-3 space-y-2">
                {details.map((c) => (
                  <div key={c.id} className="flex items-start justify-between gap-4">
                    <dt className="shrink-0 text-small text-ink-700">{c.header}</dt>
                    <dd className="min-w-0 text-right text-ink-900">{c.cell(row)}</dd>
                  </div>
                ))}
              </dl>
              {actions && <div className="mt-4 flex flex-wrap gap-2">{actions.cell(row)}</div>}
            </Card>
          </li>
        ))}
      </ul>
    </div>
  );
}
