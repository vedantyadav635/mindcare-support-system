/** Counsellors and appointments. Backend: routers/appointment.py */
import client, { data } from "./client";

/** GET /counsellors -> [{id, full_name, qualification, specialization}] */
export const counsellors = () => data(client.get("/counsellors"));

/**
 * POST /appointments (student)  body: {slot_id, reason}
 * -> {id, status, reason, start_time, end_time, student_id, student_name, counsellor_id, counsellor_name}
 * 409 if someone else booked the slot first.
 */
export const book = (slotId, reason) => data(client.post("/appointments", { slot_id: slotId, reason }));

/** GET /appointments/mine -> [appointment] (counsellors also get counsellor_notes) */
export const mine = () => data(client.get("/appointments/mine"));

/**
 * PATCH /appointments/{id}  body: {status?, counsellor_notes?}
 * Students may only send {status: "cancelled"}. Counsellors: requested -> confirmed|cancelled, confirmed -> completed|cancelled.
 */
export const update = (id, changes) => data(client.patch(`/appointments/${id}`, changes));

export const STATUSES = ["requested", "confirmed", "cancelled", "completed"];
