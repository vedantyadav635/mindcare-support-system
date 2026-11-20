/**
 * WeekSlots: a week of the counsellor's slots, one row per day. Free slots have a delete button;
 * booked slots are marked and can't be deleted (cancel the appointment first).
 *   weekStart: the Monday (a Date).  slotsByDay: { "YYYY-MM-DD": [slot] }
 */
import { ChevronLeft, ChevronRight, Trash2 } from "lucide-react";
import { dayKey, sevenDays, startOfDay } from "../../utils/dates";
import { formatTimeRange, longDate, shortDate } from "../../utils/format";
import { Badge, Button, Card, cx } from "../ui";

export default function WeekSlots({ weekStart, onWeek, slotsByDay, onDelete }) {
  const days = sevenDays(weekStart);
  const todayKey = dayKey(startOfDay());

  return (
    <section aria-labelledby="week-title">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 id="week-title" className="text-h3">{shortDate(days[0])} – {shortDate(days[6])}</h2>
        <div className="flex gap-2">
          <Button variant="secondary" size="sm" onClick={() => onWeek(-1)} aria-label="Previous week"><ChevronLeft aria-hidden="true" className="size-5" /></Button>
          <Button variant="secondary" size="sm" onClick={() => onWeek(0)}>This week</Button>
          <Button variant="secondary" size="sm" onClick={() => onWeek(1)} aria-label="Next week"><ChevronRight aria-hidden="true" className="size-5" /></Button>
        </div>
      </div>

      <ul className="space-y-3">
        {days.map((date) => {
          const key = dayKey(date);
          const slots = slotsByDay[key] ?? [];
          return (
            <li key={key}>
              <Card padding="md" className={cx("flex flex-col gap-3 sm:flex-row sm:items-start", key === todayKey && "ring-2 ring-brand-300")}>
                <h3 className="w-40 shrink-0 text-body">
                  {longDate(date)}
                  {key === todayKey && <span className="ml-2 text-small font-semibold text-ink-700">Today</span>}
                </h3>
                {slots.length === 0 ? (
                  <p className="text-ink-700">No slots</p>
                ) : (
                  <ul className="flex flex-1 flex-wrap gap-2">
                    {slots.map((slot) => {
                      const range = formatTimeRange(slot.start_time, slot.end_time);
                      return (
                        <li key={slot.id} className="flex items-center gap-2 rounded-pill bg-sand py-1 pl-4 pr-1.5">
                          <span className="font-semibold text-ink-900">{range}</span>
                          {slot.is_booked ? (
                            <Badge status="success">Booked</Badge>
                          ) : (
                            <Button variant="ghost" size="sm" className="!min-h-8 !px-2" onClick={() => onDelete(slot)} aria-label={`Delete the free time ${range} on ${longDate(date)}`}>
                              <Trash2 aria-hidden="true" className="size-4" />
                            </Button>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Card>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
