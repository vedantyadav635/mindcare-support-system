/**
 * The ONLY place that talks to the backend. Every other api/*.js file uses this Axios instance.
 *
 * - Adds "Authorization: Bearer <token>" to every request when logged in.
 * - Turns backend errors into an ApiError with a readable message (error.message) and status.
 * - On 401 (expired or invalid token) it clears the session and calls the handler that
 *   AuthContext registers, which sends the user to /login.
 *
 * The token is kept in memory plus sessionStorage (gone when the tab closes), never localStorage.
 */
import axios from "axios";
import { API_URL } from "../config";

const STORAGE_KEY = "mindcare_token";

// ---------- Token ----------

function readStoredToken() {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null; // storage can be blocked (private mode, strict settings)
  }
}

let token = readStoredToken();

export const getToken = () => token;

export function setToken(newToken) {
  token = newToken;
  try {
    if (newToken) sessionStorage.setItem(STORAGE_KEY, newToken);
    else sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore: the token still works in memory for this page load
  }
}

// ---------- 401 handling ----------

let unauthorizedHandler = () => {};

/** AuthContext registers what to do when the server says our token is no longer valid. */
export function onUnauthorized(handler) {
  unauthorizedHandler = handler;
  return () => {
    if (unauthorizedHandler === handler) unauthorizedHandler = () => {};
  };
}

// ---------- Errors ----------

export class ApiError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status; // 0 = no response (offline / server down)
  }
}

function readableMessage(error) {
  if (!error.response) {
    return error.code === "ECONNABORTED"
      ? "The server took too long to answer. Please try again."
      : "Can't reach the server. Please check your connection and try again.";
  }
  // FastAPI errors: {"detail": "text"} or {"detail": [{"msg": "..."}]} for validation errors
  const detail = error.response.data?.detail;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) return detail.map((d) => d.msg.replace(/^Value error, /, "")).join(". ");
  return "Something went wrong. Please try again.";
}

// ---------- The Axios instance ----------

const client = axios.create({ baseURL: API_URL, timeout: 30000 });

client.interceptors.request.use((config) => {
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

client.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status ?? 0;
    // Only when we SENT a token: a wrong password on the login form is also 401, but that's not a logout
    if (status === 401 && error.config?.headers?.Authorization) {
      setToken(null);
      unauthorizedHandler();
    }
    return Promise.reject(new ApiError(status, readableMessage(error)));
  },
);

export default client;

// ---------- Helpers for the api/*.js modules ----------

/** Unwrap Axios responses: await data(client.get(...)) returns the JSON body. */
export const data = (request) => request.then((response) => response.data);

/** Drop empty query parameters, so { tag: "" } doesn't become "?tag=". */
export function cleanParams(params) {
  return Object.fromEntries(Object.entries(params).filter(([, value]) => value !== undefined && value !== null && value !== ""));
}
