/** /counsellor/appointments: pending requests (Confirm / Decline), then Upcoming and Past tabs, with private notes. */
import { useState } from "react";
import * as appointmentsApi from "../../api/appointments";
import CounsellorAppointmentCard from "../../components/appointments/CounsellorAppointmentCard";
import TimezoneNote from "../../components/appointments/TimezoneNote";
import ConfirmModal from "../../components/ConfirmModal";
import ErrorNotice from "../../components/ErrorNotice";
import { Button, EmptyState, PageHeader, Spinner, TabPanel, Tabs, useToast } from "../../components/ui";
import useApi from "../../hooks/useApi";
import { splitAppointments } from "../../utils/appointments";
import { longDate } from "../../utils/format";

const DONE_MESSAGE = { confirmed: "Session confirmed", completed: "Marked as completed", cancelled: "Session cancelled" };

export default function CounsellorAppointments() {
  const toast = useToast();
  const list = useApi(appointmentsApi.mine);
  const [tab, setTab] = useState("upcoming");
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  async function update(appointment, changes, message) {
    try {
      await appointmentsApi.update(appointment.id, changes);
      toast(message);
      await list.reload();
    } catch (e) {
      toast(e.message, "error");
    }
  }

  /** Confirm and Complete go straight through; cancelling or declining asks first. */
  function changeStatus(appointment, status) {
    if (status !== "cancelled") return update(appointment, { status }, DONE_MESSAGE[status]);
    const declining = appointment.status === "requested";
    setConfirm({
      title: declining ? "Decline this request?" : "Cancel this session?",
      text: `${appointment.student_name}'s session on ${longDate(appointment.start_time)} will be cancelled and the time will open up again.`,
      confirmLabel: declining ? "Decline request" : "Cancel session",
      cancelLabel: "Keep it",
      onConfirm: async () => {
        setBusy(true);
        await update(appointment, { status: "cancelled" }, DONE_MESSAGE.cancelled);
        setBusy(false);
        setConfirm(null);
      },
    });
  }

  const saveNotes = (appointment, text) => update(appointment, { counsellor_notes: text }, "Notes saved");

  const groups = list.data ? splitAppointments(list.data) : null;
  const shown = groups ? (tab === "upcoming" ? groups.confirmed : groups.past) : [];

  return (
    <div className="space-y-10">
      <PageHeader title="Appointments" subtitle="Requests from students, your upcoming sessions, and your private notes." />
      <TimezoneNote className="-mt-6" />

      {list.loading ? (
        <div className="flex justify-center py-16 text-brand-500"><Spinner size="lg" label="Loading appointments" /></div>
      ) : list.error ? (
        <div className="max-w-md space-y-4">
          <ErrorNotice>{list.error}</ErrorNotice>
          <Button variant="secondary" onClick={list.reload}>Try again</Button>
        </div>
      ) : (
        <>
          <section aria-labelledby="pending-title">
            <h2 id="pending-title" className="mb-4">Pending requests <span className="text-ink-700">({groups.requested.length})</span></h2>
            {groups.requested.length === 0 ? (
              <EmptyState title="No requests waiting" text="New requests from students will appear here." />
            ) : (
              <ul className="space-y-4">
                {groups.requested.map((a) => (
                  <li key={a.id}><CounsellorAppointmentCard appointment={a} onStatus={changeStatus} onSaveNotes={saveNotes} /></li>
                ))}
              </ul>
            )}
          </section>

          <section aria-label="Sessions">
            <Tabs
              idPrefix="counsellor-appts"
              label="Sessions"
              value={tab}
              onChange={setTab}
              tabs={[{ id: "upcoming", label: "Upcoming", count: groups.confirmed.length }, { id: "past", label: "Past", count: groups.past.length }]}
            />
            <TabPanel idPrefix="counsellor-appts" value={tab} className="mt-6">
              {shown.length === 0 ? (
                <EmptyState
                  title={tab === "upcoming" ? "No confirmed sessions coming up" : "No past sessions yet"}
                  text={tab === "upcoming" ? "Confirm a request above and it will show here." : "Completed and cancelled sessions will show up here."}
                />
              ) : (
                <ul className="space-y-4">
                  {shown.map((a) => (
                    <li key={a.id}>
                      <CounsellorAppointmentCard appointment={a} onStatus={changeStatus} onSaveNotes={saveNotes} showActions={tab === "upcoming"} />
                    </li>
                  ))}
                </ul>
              )}
            </TabPanel>
          </section>
        </>
      )}

      <ConfirmModal request={confirm} busy={busy} onClose={() => !busy && setConfirm(null)} />
    </div>
  );
}
