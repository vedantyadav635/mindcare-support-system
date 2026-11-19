/** Auth and own account. Backend: routers/auth.py, routers/account.py */
import client, { data } from "./client";

/** POST /auth/register: {email, password, full_name, enrollment_no, department, year, consent_given} -> UserOut */
export const register = (form) => data(client.post("/auth/register", form));

/** POST /auth/login -> {access_token, token_type, role} */
export const login = (email, password) => data(client.post("/auth/login", { email, password }));

/** GET /auth/me -> {id, email, full_name, role, is_active, created_at} */
export const me = () => data(client.get("/auth/me"));

/** DELETE /me (students only): permanently deletes the account and all its data. -> null */
export const deleteAccount = (password) => data(client.delete("/me", { data: { password } }));
