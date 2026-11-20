/**
 * AddSlotForm: the counsellor picks a date, a start and an end time (their local time) and adds a free slot.
 * Backend errors (for example an overlap with another slot) are shown as they come.
 *   onAdd(startIso, endIso, date) must return a promise; it throws an ApiError on failure.
 */
import { Plus } from "lucide-react";
import { useState } from "react";
import { dayKey, toIso } from "../../utils/dates";
import ErrorNotice from "../ErrorNotice";
import { Button, Card, FormField, Input } from "../ui";
import TimezoneNote from "./TimezoneNote";

export default function AddSlotForm({ onAdd }) {
  const [today] = useState(() => dayKey(new Date()));
  const [form, setForm] = useState({ date: today, start: "10:00", end: "10:45" });
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (form.end <= form.start) {
      setError("The end time must be after the start time.");
      return;
    }
    setBusy(true);
    try {
      await onAdd(toIso(form.date, form.start), toIso(form.date, form.end), form.date);
    } catch (e) {
      setError(e.message); // e.g. "This slot overlaps one of your existing slots"
    }
    setBusy(false);
  }

  return (
    <Card tint="lilac">
      <h2 className="mb-4 text-h3">Add a free time</h2>
      <form onSubmit={submit} className="grid gap-4 sm:grid-cols-3 lg:grid-cols-[1fr_1fr_1fr_auto] lg:items-end">
        <FormField label="Date"><Input type="date" min={today} required value={form.date} onChange={update("date")} /></FormField>
        <FormField label="Starts"><Input type="time" required value={form.start} onChange={update("start")} /></FormField>
        <FormField label="Ends"><Input type="time" required value={form.end} onChange={update("end")} /></FormField>
        <Button type="submit" loading={busy} className="sm:col-span-3 lg:col-span-1"><Plus aria-hidden="true" className="size-5" /> Add</Button>
      </form>
      <div className="mt-4"><ErrorNotice>{error}</ErrorNotice></div>
      <TimezoneNote className="mt-4" />
    </Card>
  );
}
