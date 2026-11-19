/** Wellbeing trends for charts. Backend: routers/wellbeing.py */
import client, { data } from "./client";

/**
 * GET /wellbeing/trends?period=week|month
 * week  -> {period, points:[{date, mood, stress, sleep_hours}] (7 days, nulls for missing days), summary}
 * month -> {period, points:[{week_start, avg_mood, avg_stress, avg_sleep}], summary}
 * summary: {avg_mood, avg_stress, avg_sleep, entries_count, streak_days}
 */
export const trends = (period = "week") => data(client.get("/wellbeing/trends", { params: { period } }));
