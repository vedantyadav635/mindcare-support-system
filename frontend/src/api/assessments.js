/** PHQ-9 / GAD-7 self-assessments. Backend: routers/assessment.py */
import client, { data } from "./client";

export const TYPES = ["PHQ9", "GAD7"];

/** GET /assessments/questions/{type} -> {type, stem, questions:[{number, text}], options:[{value, label}], disclaimer} */
export const questions = (type) => data(client.get(`/assessments/questions/${type}`));

/**
 * POST /assessments  body: {type, answers: [0-3, ...]} (one per question, in order)
 * -> {id, type, total_score, severity_band, message, suggest_counsellor, crisis, crisis_response|null, disclaimer}
 */
export const submit = (type, answers) => data(client.post("/assessments", { type, answers }));

/** GET /assessments/history -> {results:[{id, type, total_score, severity_band, created_at}] newest first, disclaimer} */
export const history = () => data(client.get("/assessments/history"));
