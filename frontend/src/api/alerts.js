/** Crisis alerts (counsellors). Backend: routers/alerts.py */
import client, { cleanParams, data } from "./client";

export const ALERT_STATUSES = ["open", "seen", "closed"];

/**
 * GET /alerts?status=open|seen|closed (omit for all)
 * -> [{id, student_id, student_name, source, matched_rule, reason, excerpt, status, handled_by, created_at}] newest first
 */
export const list = (status) => data(client.get("/alerts", { params: cleanParams({ status }) }));

/** PATCH /alerts/{id}  body: {status} -> alert (records handled_by) */
export const update = (id, status) => data(client.patch(`/alerts/${id}`, { status }));
