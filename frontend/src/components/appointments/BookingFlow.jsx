/**
 * "Book a session" in three steps:  1. choose a counsellor   2. pick a day and a free time   3. say why, confirm.
 * Calls POST /appointments. If someone else just took the slot (409) the free times are reloaded and the
 * student is sent back to step 2 with a friendly note.
 *
 * Privacy: the reason lives only in this component's state until it is sent.
 */
import { ArrowLeft, ArrowRight, X } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import * as appointmentsApi from "../../api/appointments";
import * as slotsApi from "../../api/slots";
import useApi from "../../hooks/useApi";
import { addDays, daysBetween, dayKey, groupByDay, sevenDays, startOfDay } from "../../utils/dates";
import { formatTimeRange, longDate } from "../../utils/format";
import ErrorNotice from "../ErrorNotice";
import ProgressDots from "../ProgressDots";
import { Avatar, Button, Card, Chip, EmptyState, FormField, Spinner, TextArea } from "../ui";
import DayStrip from "./DayStrip";
import TimezoneNote from "./TimezoneNote";

const STEP_NAMES = ["Choose a counsellor", "Pick a time", "Confirm"];
const SLOT_TAKEN = "That slot was just taken, please pick another.";

export default function BookingFlow({ onClose, onBooked }) {
  const counsellors = useApi(appointmentsApi.counsellors);
  const [step, setStep] = useState(1);
  const [counsellor, setCounsellor] = useState(null);

  return (
    <Card tint="peach" className="mb-8 animate-fade-up">
      <div className="mb-6 flex items-start justify-between gap-4">
        <div>
          <h2>Book a session</h2>
          <p aria-live="polite" className="mt-1 text-ink-700">Step {step} of 3: {STEP_NAMES[step - 1]}</p>
        </div>
        <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close booking"><X aria-hidden="true" className="size-5" /></Button>
      </div>
      <div className="mb-6"><ProgressDots label="Booking progress" total={3} current={step} valueText={`Step ${step} of 3`} /></div>

      {step === 1 ? (
        <ChooseCounsellor
          counsellors={counsellors}
          selectedId={counsellor?.id}
          onChoose={(chosen) => { setCounsellor(chosen); setStep(2); }}
        />
      ) : (
        // key = counsellor: choosing someone else starts the time-picking fresh
        <ScheduleStep key={counsellor.id} counsellor={counsellor} step={step} onStep={setStep} onBooked={onBooked} />
      )}
    </Card>
  );
}

// ---------- Step 1 ----------

function ChooseCounsellor({ counsellors, selectedId, onChoose }) {
  if (counsellors.loading) return <div className="flex justify-center py-10 text-brand-500"><Spinner label="Loading counsellors" /></div>;
  if (counsellors.error) {
    return (
      <div className="max-w-md space-y-4">
        <ErrorNotice>{counsellors.error}</ErrorNotice>
        <Button variant="secondary" onClick={counsellors.reload}>Try again</Button>
      </div>
    );
  }
  if (counsellors.data.length === 0) {
    return <EmptyState title="No counsellors available yet" text="Please check back soon, or use the help button if you need someone now." />;
  }
  return (
    <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {counsellors.data.map((counsellor) => (
        <li key={counsellor.id}>
          <button
            type="button"
            aria-pressed={counsellor.id === selectedId}
            onClick={() => onChoose(counsellor)}
            className="flex h-full w-full items-center gap-4 rounded-lg bg-surface p-4 text-left shadow-soft transition hover:-translate-y-1 hover:shadow-lift aria-pressed:ring-2 aria-pressed:ring-brand-500"
          >
            <Avatar name={counsellor.full_name} size="lg" />
            <span className="min-w-0">
              <span className="block font-heading font-bold text-ink-900">{counsellor.full_name}</span>
              <span className="block text-small text-ink-700">{counsellor.specialization ?? counsellor.qualification ?? "Counsellor"}</span>
            </span>
          </button>
        </li>
      ))}
    </ul>
  );
}

// ---------- Steps 2 and 3 ----------

function ScheduleStep({ counsellor, step, onStep, onBooked }) {
  const load = useCallback(() => slotsApi.available(counsellor.id), [counsellor.id]);
  const { data: slots, error, loading, reload } = useApi(load);
  const [notice, setNotice] = useState(""); // e.g. "That slot was just taken"

  async function slotTaken() {
    setNotice(SLOT_TAKEN);
    onStep(2);
    await reload(); // fresh free times (the taken one disappears)
  }

  if (loading) return <div className="flex justify-center py-10 text-brand-500"><Spinner label="Loading free times" /></div>;
  if (error) {
    return (
      <div className="max-w-md space-y-4">
        <ErrorNotice>{error}</ErrorNotice>
        <Button variant="secondary" onClick={reload}>Try again</Button>
      </div>
    );
  }

  return (
    <div>
      <ErrorNotice>{notice}</ErrorNotice>
      {slots.length === 0 ? (
        <EmptyState
          title={`No free times with ${counsellor.full_name} right now`}
          text="Please pick another counsellor, or check back later."
          action={<Button variant="secondary" onClick={() => onStep(1)}>Choose another counsellor</Button>}
        />
      ) : (
        // key = the set of free slots: when it changes (after a 409) the picker starts clean
        <Schedule key={slots.map((s) => s.id).join("-")} counsellor={counsellor} slots={slots} step={step} onStep={onStep} onSlotTaken={slotTaken} onBooked={onBooked} />
      )}
    </div>
  );
}

const MAX_WEEKS_AHEAD = 12;

export function Schedule({ counsellor, slots, step, onStep, onSlotTaken, onBooked }) {
  const today = useMemo(() => startOfDay(), []);
  const byDay = useMemo(() => groupByDay(slots, (s) => s.start_time), [slots]);
  const firstKey = Object.keys(byDay).sort()[0];
  const lastKey = Object.keys(byDay).sort().at(-1);
  const lastWeek = Math.min(MAX_WEEKS_AHEAD, Math.floor(daysBetween(today, new Date(`${lastKey}T00:00`)) / 7));

  // Start on the week of the first free day, with that day already selected
  const [weekOffset, setWeekOffset] = useState(Math.max(0, Math.floor(daysBetween(today, new Date(`${firstKey}T00:00`)) / 7)));
  const [selectedDay, setSelectedDay] = useState(firstKey);
  const [slotId, setSlotId] = useState(null);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const days = sevenDays(addDays(today, weekOffset * 7)).map((date) => ({ key: dayKey(date), date, count: byDay[dayKey(date)]?.length ?? 0 }));
  const slot = slots.find((s) => s.id === slotId);

  async function confirm() {
    setBusy(true);
    setError("");
    try {
      await appointmentsApi.book(slotId, reason.trim());
      onBooked(counsellor, slot);
      return;
    } catch (e) {
      if (e.status === 409) {
        await onSlotTaken();
        return;
      }
      setError(e.message);
    }
    setBusy(false);
  }

  if (step === 2) {
    return (
      <div>
        <p className="mb-4 flex items-center gap-3 text-ink-900">
          <Avatar name={counsellor.full_name} size="sm" /> <span className="font-heading font-bold">{counsellor.full_name}</span>
        </p>
        <DayStrip
          days={days}
          selectedKey={selectedDay}
          onSelect={(key) => { setSelectedDay(key); setSlotId(null); }}
          onPrev={() => setWeekOffset(weekOffset - 1)}
          onNext={() => setWeekOffset(weekOffset + 1)}
          canPrev={weekOffset > 0}
          canNext={weekOffset < lastWeek}
        />

        <h3 className="mb-3 mt-6 text-body font-extrabold">Free times on {longDate(new Date(`${selectedDay}T00:00`))}</h3>
        {byDay[selectedDay] ? (
          <ul className="flex flex-wrap gap-2">
            {byDay[selectedDay].map((s) => (
              <li key={s.id}>
                <Chip size="md" selected={s.id === slotId} onClick={() => setSlotId(s.id)}>{formatTimeRange(s.start_time, s.end_time)}</Chip>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-ink-700">No free times on this day. Pick a day with a dot.</p>
        )}
        <TimezoneNote className="mt-4" />

        <div className="mt-8 flex justify-between gap-3">
          <Button variant="secondary" onClick={() => onStep(1)}><ArrowLeft aria-hidden="true" className="size-5" /> Back</Button>
          <Button onClick={() => onStep(3)} disabled={!slot}>Next <ArrowRight aria-hidden="true" className="size-5" /></Button>
        </div>
      </div>
    );
  }

  // Step 3: reason + confirm
  return (
    <form onSubmit={(e) => { e.preventDefault(); confirm(); }} className="max-w-xl">
      <div className="mb-5 flex items-center gap-4 rounded-md bg-surface p-4">
        <Avatar name={counsellor.full_name} />
        <div>
          <p className="font-heading font-bold text-ink-900">{counsellor.full_name}</p>
          <p className="text-ink-700">{longDate(slot.start_time)}, {formatTimeRange(slot.start_time, slot.end_time)}</p>
        </div>
      </div>
      <FormField label="What would you like to talk about?" hint="Only your counsellor sees this. A few words are enough.">
        <TextArea required maxLength={1000} value={reason} onChange={(e) => setReason(e.target.value)} />
      </FormField>
      <div className="mt-4"><ErrorNotice>{error}</ErrorNotice></div>
      <TimezoneNote className="mt-4" />
      <div className="mt-6 flex justify-between gap-3">
        <Button variant="secondary" onClick={() => onStep(2)} disabled={busy}><ArrowLeft aria-hidden="true" className="size-5" /> Back</Button>
        <Button type="submit" loading={busy} disabled={!reason.trim()}>Request this session</Button>
      </div>
    </form>
  );
}
