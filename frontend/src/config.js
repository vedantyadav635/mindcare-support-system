/** App-wide settings. Change the app name here and it changes everywhere. */
export const APP_NAME = "MindCare";

// Backend address (set VITE_API_URL in frontend/.env to change it)
export const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:8000/api";

// Where each role lands after logging in
export const ROLE_HOME = { student: "/app", counsellor: "/counsellor", admin: "/admin" };

// Helplines for the crisis screen. Kept HERE (not fetched) so the screen loads instantly and works
// offline or logged out. Any extra numbers the backend sends in a crisis response are added to these.
export const HELPLINES = [
  { id: "telemanas", label: "Tele-MANAS", number: "14416", note: "Free mental health helpline, 24x7 (Government of India)" },
  { id: "telemanas-tollfree", label: "Tele-MANAS", number: "1-800-891-4416", note: "The same helpline, toll-free number" },
  { id: "emergency", label: "Emergency", number: "112", note: "If you or someone else is in immediate danger" },
];
