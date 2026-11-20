/** /counsellor/availability: add free times and see/delete them in a week view. Times are in the local time zone. */
import { useState } from "react";
import { useLocation } from "react-router-dom";
import * as slotsApi from "../../api/slots";
import AddSlotForm from "../../components/appointments/AddSlotForm";
import WeekSlots from "../../components/appointments/WeekSlots";
import ErrorNotice from "../../components/ErrorNotice";
import { Button, Card, PageHeader, Spinner, useToast } from "../../components/ui";
import useApi from "../../hooks/useApi";
import { addDays, groupByDay, startOfWeek } from "../../utils/dates";

export default function Availability() {
  const toast = useToast();
  const slots = useApi(slotsApi.mine);
  const [weekStart, setWeekStart] = useState(() => startOfWeek());

  // week buttons: -1 / +1 move a week, 0 returns to this week
  const changeWeek = (direction) => setWeekStart(direction === 0 ? startOfWeek() : addDays(weekStart, direction * 7));

  async function add(startIso, endIso, date) {
    await slotsApi.create(startIso, endIso); // throws on overlap etc.; the form shows the message
    toast("Free time added");
    setWeekStart(startOfWeek(new Date(`${date}T00:00`))); // jump to the week that was just changed
    await slots.reload();
  }

  async function remove(slot) {
    try {
      await slotsApi.remove(slot.id);
      toast("Free time removed");
      slots.reload();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  // Arriving from "Schedule session" on a crisis alert
  const forStudent = useLocation().state?.forStudent;

  return (
    <div className="space-y-8">
      <PageHeader title="Availability" subtitle="Add the times students can book. Booked times can't be removed until the session is cancelled." />
      {forStudent && (
        <Card tint="sky" padding="md" role="note">
          <p className="font-heading font-bold text-ink-900">Scheduling support for {forStudent}</p>
          <p className="mt-1 text-ink-700">
            Add a free time below, soon. {forStudent} can then book it from their Sessions page. You may also want to reach out to
            them directly, because students aren't told automatically.
          </p>
        </Card>
      )}
      <AddSlotForm onAdd={add} />

      {slots.loading ? (
        <div className="flex justify-center py-12 text-brand-500"><Spinner size="lg" label="Loading your times" /></div>
      ) : slots.error ? (
        <div className="max-w-md space-y-4">
          <ErrorNotice>{slots.error}</ErrorNotice>
          <Button variant="secondary" onClick={slots.reload}>Try again</Button>
        </div>
      ) : (
        <WeekSlots weekStart={weekStart} onWeek={changeWeek} slotsByDay={groupByDay(slots.data, (s) => s.start_time)} onDelete={remove} />
      )}
    </div>
  );
}
