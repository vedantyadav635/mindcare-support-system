/** /app/appointments: the student's sessions (Upcoming / Past), the "Book a session" flow, and cancelling. */
import { CalendarPlus } from "lucide-react";
import { useState } from "react";
import { useLocation } from "react-router-dom";
import * as appointmentsApi from "../../api/appointments";
import BookingFlow from "../../components/appointments/BookingFlow";
import StudentAppointmentCard from "../../components/appointments/StudentAppointmentCard";
import ConfirmModal from "../../components/ConfirmModal";
import ErrorNotice from "../../components/ErrorNotice";
import { Button, EmptyState, PageHeader, Spinner, TabPanel, Tabs, useToast } from "../../components/ui";
import useApi from "../../hooks/useApi";
import { splitAppointments, studentUpcoming } from "../../utils/appointments";
import { longDate } from "../../utils/format";

export default function StudentAppointments() {
  const toast = useToast();
  const location = useLocation();
  const list = useApi(appointmentsApi.mine);
  const [tab, setTab] = useState("upcoming");
  // "Book an urgent session" on the help screen links here with state.book, which opens the flow straight away
  const [booking, setBooking] = useState(() => location.state?.book === true);
  const [confirm, setConfirm] = useState(null); // the cancel request being confirmed
  const [busy, setBusy] = useState(false);

  const groups = list.data ? splitAppointments(list.data) : null;
  const upcoming = groups ? studentUpcoming(groups) : [];
  const shown = tab === "upcoming" ? upcoming : groups?.past ?? [];

  function booked(counsellor) {
    setBooking(false);
    setTab("upcoming");
    toast(`Requested! ${counsellor.full_name} will confirm your session.`);
    list.reload();
  }

  function askToCancel(appointment) {
    setConfirm({
      title: "Cancel this session?",
      text: `Your session with ${appointment.counsellor_name} on ${longDate(appointment.start_time)} will be cancelled and the time will open up for others.`,
      confirmLabel: "Cancel session",
      onConfirm: async () => {
        setBusy(true);
        try {
          await appointmentsApi.update(appointment.id, { status: "cancelled" });
          toast("Session cancelled");
          list.reload();
        } catch (e) {
          toast(e.message, "error");
        }
        setBusy(false);
        setConfirm(null);
      },
    });
  }

  return (
    <div>
      <PageHeader
        title="Your sessions"
        subtitle="Private, friendly, and you don't need a big reason."
        action={!booking && <Button size="lg" onClick={() => setBooking(true)}><CalendarPlus aria-hidden="true" className="size-5" /> Book a session</Button>}
      />

      {booking && <BookingFlow onClose={() => setBooking(false)} onBooked={booked} />}

      {list.loading ? (
        <div className="flex justify-center py-16 text-brand-500"><Spinner size="lg" label="Loading your sessions" /></div>
      ) : list.error ? (
        <div className="max-w-md space-y-4">
          <ErrorNotice>{list.error}</ErrorNotice>
          <Button variant="secondary" onClick={list.reload}>Try again</Button>
        </div>
      ) : (
        <>
          <Tabs
            idPrefix="student-appts"
            label="Your sessions"
            value={tab}
            onChange={setTab}
            tabs={[{ id: "upcoming", label: "Upcoming", count: upcoming.length }, { id: "past", label: "Past", count: groups.past.length }]}
          />
          <TabPanel idPrefix="student-appts" value={tab} className="mt-6">
            {shown.length === 0 ? (
              <EmptyState
                title={tab === "upcoming" ? "No upcoming sessions" : "No past sessions yet"}
                text={tab === "upcoming" ? "Talking to a counsellor can really help. Booking takes a minute." : "Finished and cancelled sessions will show up here."}
                action={tab === "upcoming" && !booking && <Button onClick={() => setBooking(true)}>Book a session</Button>}
              />
            ) : (
              <ul className="space-y-4">
                {shown.map((appointment) => (
                  <li key={appointment.id}>
                    <StudentAppointmentCard appointment={appointment} onCancel={tab === "upcoming" ? askToCancel : undefined} />
                  </li>
                ))}
              </ul>
            )}
          </TabPanel>
        </>
      )}

      <ConfirmModal request={confirm} busy={busy} onClose={() => !busy && setConfirm(null)} />
    </div>
  );
}
