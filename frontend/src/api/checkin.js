/** Daily check-in and its questions. Backend: routers/checkin.py */
import client, { cleanParams, data } from "./client";

/** GET /checkin/questions -> [{id, text, answer_type, options:[{label,value}]|null, metric, is_required, max_length, display_order, is_active}] */
export const questions = () => data(client.get("/checkin/questions"));

/**
 * POST /checkin
 * answers: [{question_id, option_value}] or [{question_id, text_answer}]; entryDate "YYYY-MM-DD" (optional, default today)
 * -> {entry_id, entry_date, mood, stress, sleep_hours, crisis, crisis_response|null}
 */
export const submit = (answers, entryDate) =>
  data(client.post("/checkin", { answers, ...(entryDate && { entry_date: entryDate }) }));

/** GET /checkin/today -> {done, entry: {entry_id, entry_date, mood, stress, sleep_hours, answers:[...]}|null} */
export const today = () => data(client.get("/checkin/today"));

/** GET /checkin/history?from=&to= -> [entry] oldest first */
export const history = ({ from, to } = {}) => data(client.get("/checkin/history", { params: cleanParams({ from, to }) }));

// ---------- Admin: manage questions ----------

/** POST /admin/checkin/questions  body: {text, answer_type, options, metric, is_required, max_length, display_order, is_active} */
export const createQuestion = (question) => data(client.post("/admin/checkin/questions", question));

/** PUT /admin/checkin/questions/{id}  (replaces the whole question) */
export const updateQuestion = (id, question) => data(client.put(`/admin/checkin/questions/${id}`, question));

/** DELETE /admin/checkin/questions/{id}  (soft delete) -> null */
export const deleteQuestion = (id) => data(client.delete(`/admin/checkin/questions/${id}`));
