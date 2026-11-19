/** Sidebar / tab bar links for each role: [path, label, icon]. The first 4 show in the mobile tab bar. */
import {
  CalendarClock, CalendarHeart, ClipboardList, HeartPulse, House, LineChart, ListChecks,
  MessageCircle, ShieldAlert, Sparkles, SunMedium, Users,
} from "lucide-react";

export const NAVIGATION = {
  student: [
    { to: "/app", label: "Home", icon: House, end: true },
    { to: "/app/checkin", label: "Check-in", icon: SunMedium },
    { to: "/app/chat", label: "Talk", icon: MessageCircle },
    { to: "/app/resources", label: "Explore", icon: Sparkles },
    { to: "/app/trends", label: "Trends", icon: LineChart },
    { to: "/app/assessments", label: "Self-check", icon: ClipboardList },
    { to: "/app/appointments", label: "Counsellors", icon: CalendarHeart },
  ],
  counsellor: [
    { to: "/counsellor", label: "Home", icon: House, end: true },
    { to: "/counsellor/appointments", label: "Appointments", icon: CalendarHeart },
    { to: "/counsellor/availability", label: "Availability", icon: CalendarClock },
    { to: "/counsellor/alerts", label: "Alerts", icon: ShieldAlert },
  ],
  admin: [
    { to: "/admin", label: "Overview", icon: HeartPulse, end: true },
    { to: "/admin/users", label: "Users", icon: Users },
    { to: "/admin/resources", label: "Resources", icon: Sparkles },
    { to: "/admin/questions", label: "Questions", icon: ListChecks },
  ],
};

export const MOBILE_TABS = 4; // more than this go into a "More" menu on phones
