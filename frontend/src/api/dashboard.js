/** One-call home pages. Backend: routers/dashboard.py */
import client, { data } from "./client";

/**
 * GET /dashboard/student
 * -> {checkin_done_today, trend:[{date, mood, stress, sleep_hours}], recommendations:[{resource, score, why}], next_appointment|null}
 */
export const student = () => data(client.get("/dashboard/student"));

/** GET /dashboard/counsellor -> {open_alerts, todays_appointments:[...], pending_requests:[...]} */
export const counsellor = () => data(client.get("/dashboard/counsellor"));
