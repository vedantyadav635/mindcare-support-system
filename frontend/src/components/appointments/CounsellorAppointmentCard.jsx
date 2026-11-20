/**
 * One appointment as the counsellor sees it: student, time, reason, status actions, and private notes.
 *   onStatus(appointment, status): Confirm / Decline / Complete / Cancel (the page asks first for the risky ones)
 *   onSaveNotes(appointment, text): must return a promise
 * Notes are private to the counsellor: the backend never sends them to students. They are never logged.
 */
import { CalendarClock } from "lucide-react";
import { useState } from "react";
import { formatTimeRange, longDate } from "../../utils/format";
import StatusBadge from "../StatusBadge";
import { Avatar, Button, Card, FormField, TextArea } from "../ui";

// status -> the actions allowed from it (same rules as the backend)
const ACTIONS = {
  requested: [["confirmed", "Confirm", "primary"], ["cancelled", "Decline", "secondary"]],
  confirmed: [["completed", "Mark completed", "primary"], ["cancelled", "Cancel session", "secondary"]],
};

export default function CounsellorAppointmentCard({ appointment, onStatus, onSaveNotes, showActions = true }) {
  const { student_name: name, start_time: start, end_time: end, reason, status } = appointment;
  const saved = appointment.counsellor_notes ?? "";
  const [notes, setNotes] = useState(saved);
  const [saving, setSaving] = useState(false);

  async function save() {
    setSaving(true);
    await onSaveNotes(appointment, notes.trim());
    setSaving(false);
  }

  return (
    <Card padding="md">
      <div className="flex flex-wrap items-center gap-4">
        <Avatar name={name} />
        <div className="min-w-0 flex-1">
          <p className="font-heading text-h3 font-bold text-ink-900">{name}</p>
          <p className="flex items-center gap-2 text-ink-900">
            <CalendarClock aria-hidden="true" className="size-4 shrink-0" />
            {longDate(start)}, {formatTimeRange(start, end)}
          </p>
        </div>
        <StatusBadge status={status} />
      </div>

      <p className="mt-4 whitespace-pre-line break-words rounded-md bg-sand px-4 py-3 text-ink-700">
        <span className="font-semibold text-ink-900">Reason: </span>{reason}
      </p>

      {showActions && ACTIONS[status] && (
        <div className="mt-4 flex flex-wrap gap-2">
          {ACTIONS[status].map(([next, label, variant]) => (
            <Button key={next} variant={variant} size="sm" onClick={() => onStatus(appointment, next)} aria-label={`${label}: session with ${name}`}>
              {label}
            </Button>
          ))}
        </div>
      )}

      <div className="mt-5">
        <FormField label="Your private notes" hint="Only you can see these. Students never do." optional>
          <TextArea maxLength={5000} value={notes} onChange={(e) => setNotes(e.target.value)} />
        </FormField>
        <Button variant="secondary" size="sm" className="mt-3" onClick={save} loading={saving} disabled={notes.trim() === saved.trim()}>
          Save notes
        </Button>
      </div>
    </Card>
  );
}
