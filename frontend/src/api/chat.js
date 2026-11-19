/** AI support chat. Backend: routers/chat.py. Never store or log message text on the client. */
import client, { data } from "./client";

/**
 * POST /chat/message  body: {text} (1-1000 chars)
 * -> {reply, emotion|null, sentiment|null, suggested_resources:[resource], crisis, crisis_response|null, disclaimer}
 */
export const send = (text) => data(client.post("/chat/message", { text }));

/** GET /chat/history?page=&page_size= -> {items:[{id, sender, text, emotion, sentiment, created_at}] newest first, page, page_size, total} */
export const history = ({ page = 1, pageSize = 20 } = {}) =>
  data(client.get("/chat/history", { params: { page, page_size: pageSize } }));
