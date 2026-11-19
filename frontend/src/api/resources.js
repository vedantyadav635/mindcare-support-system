/** Wellness resources. Backend: routers/resource.py */
import client, { cleanParams, data } from "./client";

// Allowed values (must match backend/app/schemas/resource.py and models/resource.py)
export const RESOURCE_TYPES = ["breathing", "sleep", "article", "video", "counselling", "activity"];
export const RESOURCE_TAGS = ["low_mood", "stress", "anxiety", "sleep", "anger", "fear", "sadness", "loneliness", "academic", "crisis"];

/** GET /resources?type=&tag= -> [{id, title, type, body, url, tags, is_active}] (active only) */
export const list = ({ type, tag } = {}) => data(client.get("/resources", { params: cleanParams({ type, tag }) }));

// ---------- Admin ----------

/** POST /resources  body: {title, type, body, url, tags, is_active} (needs body or url) */
export const create = (resource) => data(client.post("/resources", resource));

/** PUT /resources/{id}  (replaces the whole resource; is_active: true restores a deleted one) */
export const update = (id, resource) => data(client.put(`/resources/${id}`, resource));

/** DELETE /resources/{id}  (soft delete) -> null */
export const remove = (id) => data(client.delete(`/resources/${id}`));
