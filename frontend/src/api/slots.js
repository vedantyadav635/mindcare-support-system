/** Counsellor availability slots. Backend: routers/appointment.py */
import client, { cleanParams, data } from "./client";

/**
 * POST /slots (counsellor)  body: {start_time, end_time} as ISO strings WITH timezone
 * (Date.prototype.toISOString() is fine). -> {id, counsellor_id, start_time, end_time, is_booked}
 */
export const create = (startTime, endTime) => data(client.post("/slots", { start_time: startTime, end_time: endTime }));

/** GET /slots/mine (counsellor) -> [slot] earliest first */
export const mine = () => data(client.get("/slots/mine"));

/** GET /slots/available?counsellor_id= -> future unbooked slots [slot] */
export const available = (counsellorId) =>
  data(client.get("/slots/available", { params: cleanParams({ counsellor_id: counsellorId }) }));

/** DELETE /slots/{id} (counsellor, own, not booked) -> null */
export const remove = (id) => data(client.delete(`/slots/${id}`));
