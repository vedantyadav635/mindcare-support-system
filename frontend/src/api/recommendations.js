/** Personalised recommendations. Backend: routers/recommendation.py */
import client, { data } from "./client";

/** GET /recommendations?limit= (1-20) -> [{resource: {...}, score: 0..1, why: "Because ..."}] */
export const list = (limit = 5) => data(client.get("/recommendations", { params: { limit } }));
