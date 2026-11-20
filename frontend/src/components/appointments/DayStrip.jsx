/**
 * DayStrip: a simple week strip for picking a day. Days with no free time are disabled.
 *   days: [{ key, date, count }]  (seven of them)   count = free times that day
 * Arrow buttons move a week at a time.
 */
import { ChevronLeft, ChevronRight } from "lucide-react";
import { longDate, shortDate, shortWeekday } from "../../utils/format";
import { Button, cx } from "../ui";

export default function DayStrip({ days, selectedKey, onSelect, onPrev, onNext, canPrev, canNext }) {
  return (
    <div>
      <div className="mb-3 flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={onPrev} disabled={!canPrev} aria-label="Previous week">
          <ChevronLeft aria-hidden="true" className="size-5" />
        </Button>
        <p aria-live="polite" className="font-heading font-bold text-ink-900">
          {shortDate(days[0].date)} – {shortDate(days[6].date)}
        </p>
        <Button variant="ghost" size="sm" onClick={onNext} disabled={!canNext} aria-label="Next week">
          <ChevronRight aria-hidden="true" className="size-5" />
        </Button>
      </div>

      <div role="group" aria-label="Pick a day" className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {days.map(({ key, date, count }) => {
          const selected = key === selectedKey;
          return (
            <button
              key={key}
              type="button"
              disabled={count === 0}
              aria-pressed={selected}
              aria-label={count ? `${longDate(date)}, ${count} free ${count === 1 ? "time" : "times"}` : `${longDate(date)}, no free times`}
              onClick={() => onSelect(key)}
              className={cx(
                "flex min-h-16 flex-col items-center justify-center rounded-md py-2 transition",
                selected ? "bg-ink-900 text-white shadow-soft" : "bg-surface text-ink-900 ring-2 ring-line hover:ring-ink-500",
                "disabled:cursor-not-allowed disabled:bg-sand disabled:text-ink-500 disabled:ring-0",
              )}
            >
              <span className="text-small">{shortWeekday(date)}</span>
              <span className="font-heading text-body font-extrabold">{date.getDate()}</span>
              {/* a dot shows the day has free times (the label above says how many) */}
              <span aria-hidden="true" className={cx("mt-1 size-1.5 rounded-pill", count ? "bg-brand-500" : "bg-transparent")} />
            </button>
          );
        })}
      </div>
    </div>
  );
}
