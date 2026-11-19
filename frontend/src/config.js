/** App-wide settings. Change the app name here and it changes everywhere. */
export const APP_NAME = "MindCare";

// Backend address (set VITE_API_URL in frontend/.env to change it)
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// Where each role lands after logging in
export const ROLE_HOME = { student: "/app", counsellor: "/counsellor", admin: "/admin" };

// Shown in the footer and the crisis screen
export const HELPLINES = [
  { name: "Tele-MANAS (free, 24x7, Govt. of India)", contact: "14416", alt: "1-800-891-4416" },
  { name: "Emergency", contact: "112" },
];
