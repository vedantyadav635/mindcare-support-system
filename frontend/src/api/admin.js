/** Admin: users and statistics. Backend: routers/admin.py
 * (Question and resource management live in api/checkin.js and api/resources.js.) */
import client, { cleanParams, data } from "./client";

/** GET /admin/users?role=&search=&page=&page_size= -> {items:[user], page, page_size, total} */
export const users = ({ role, search, page = 1, pageSize = 20 } = {}) =>
  data(client.get("/admin/users", { params: cleanParams({ role, search, page, page_size: pageSize }) }));

/**
 * POST /admin/counsellors  body: {email, full_name, qualification, specialization, phone}
 * -> {user, temporary_password} (the password is shown only in this response)
 */
export const createCounsellor = (counsellor) => data(client.post("/admin/counsellors", counsellor));

/** PATCH /admin/users/{id}  body: {is_active} -> user */
export const setUserActive = (id, isActive) => data(client.patch(`/admin/users/${id}`, { is_active: isActive }));

/**
 * GET /admin/stats -> {students, counsellors, wellbeing_entries_this_week, assessments_this_week,
 *                      appointments_by_status: {requested, confirmed, cancelled, completed}, open_alerts}
 */
export const stats = () => data(client.get("/admin/stats"));
