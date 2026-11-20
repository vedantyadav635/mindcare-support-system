/** Three big tappable tiles in soft accent colours. */
import { ArrowRight, CalendarHeart, ClipboardList, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Card } from "../ui";

const ACTIONS = [
  { to: "/app/chat", tint: "lilac", icon: MessageCircle, title: "Talk to the support chat", text: "Share how you feel, any time." },
  { to: "/app/assessments", tint: "sky", icon: ClipboardList, title: "Take a self-check", text: "Two short questionnaires." },
  { to: "/app/appointments", tint: "mint", icon: CalendarHeart, title: "Book a counsellor", text: "A private, friendly session." },
];

export default function QuickActions() {
  return (
    <section aria-labelledby="quick-title">
      <h2 id="quick-title" className="sr-only">Quick actions</h2>
      <ul className="grid gap-4 sm:grid-cols-3">
        {ACTIONS.map(({ to, tint, icon: Icon, title, text }) => (
          <li key={to}>
            <Card as={Link} to={to} tint={tint} hover padding="md" className="group flex h-full items-center gap-4 sm:flex-col sm:items-start">
              <span aria-hidden="true" className="flex size-12 shrink-0 items-center justify-center rounded-pill bg-surface shadow-soft">
                <Icon className="size-6 text-ink-900" />
              </span>
              <span className="flex-1">
                <span className="block font-heading text-h3 font-bold text-ink-900">{title}</span>
                <span className="mt-1 block text-small text-ink-700">{text}</span>
              </span>
              <ArrowRight aria-hidden="true" className="size-5 shrink-0 text-ink-900 transition group-hover:translate-x-1" />
            </Card>
          </li>
        ))}
      </ul>
    </section>
  );
}
