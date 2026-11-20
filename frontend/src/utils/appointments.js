/** Sorting appointments into the groups the screens show. */

const byStart = (a, b) => new Date(a.start_time) - new Date(b.start_time);

/**
 * Split a list of appointments (from GET /appointments/mine) by what is still ahead.
 *   requested: asked for, still waiting, and the time has not ended   (earliest first)
 *   confirmed: confirmed and the time has not ended                   (earliest first)
 *   past:      completed, cancelled, or whose time has ended          (latest first)
 */
export function splitAppointments(list, now = new Date()) {
  const requested = [];
  const confirmed = [];
  const past = [];
  for (const appointment of list) {
    const ended = new Date(appointment.end_time) <= now;
    if (!ended && appointment.status === "requested") requested.push(appointment);
    else if (!ended && appointment.status === "confirmed") confirmed.push(appointment);
    else past.push(appointment);
  }
  requested.sort(byStart);
  confirmed.sort(byStart);
  past.sort((a, b) => byStart(b, a));
  return { requested, confirmed, past };
}

/** A student's "Upcoming" tab: requested and confirmed together, earliest first. */
export const studentUpcoming = ({ requested, confirmed }) => [...requested, ...confirmed].sort(byStart);
