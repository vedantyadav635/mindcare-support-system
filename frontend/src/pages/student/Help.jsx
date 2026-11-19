/** Crisis screen ("Need help now?"). Static, so it works even if the server is down. Any logged-in role. */
import { MessageCircle, Phone } from "lucide-react";
import { Link } from "react-router-dom";
import { Button, Card, SectionBlob } from "../../components/ui";
import { HELPLINES } from "../../config";
import { useAuth } from "../../context/AuthContext";

export default function Help() {
  const { role } = useAuth();
  return (
    <div className="mx-auto max-w-2xl">
      <div className="relative mb-8 overflow-hidden rounded-xl bg-brand-50 p-6 md:p-8">
        <SectionBlob shape="circle" color="blush" className="absolute -right-8 -top-8 size-32 opacity-60" />
        <h1 className="relative">You don't have to go through this alone</h1>
        <p className="relative mt-3 text-ink-700">
          If you feel unsafe or are thinking about harming yourself, please reach out right now. Talking to someone can help.
        </p>
      </div>

      <h2 className="mb-4 text-h3">Call now (free)</h2>
      <ul className="space-y-3">
        {HELPLINES.map((line) => (
          <li key={line.name}>
            <Card padding="md" className="flex flex-wrap items-center justify-between gap-3 border-2 border-danger/30">
              <span className="font-heading font-bold text-ink-900">{line.name}</span>
              <span className="flex flex-wrap gap-2">
                {[line.contact, line.alt].filter(Boolean).map((number) => (
                  <Button key={number} as="a" href={`tel:${number.replaceAll("-", "")}`} size="sm">
                    <Phone aria-hidden="true" className="size-4" /> {number}
                  </Button>
                ))}
              </span>
            </Card>
          </li>
        ))}
      </ul>

      {role === "student" && (
        <div className="mt-8 grid gap-4 sm:grid-cols-2">
          <Card tint="lilac" padding="md">
            <h2 className="text-h3">Talk to a counsellor</h2>
            <p className="mt-2 text-ink-700">Book the earliest free session with your campus counsellor.</p>
            <Button as={Link} to="/app/appointments" variant="secondary" size="sm" className="mt-4">Book an urgent session</Button>
          </Card>
          <Card tint="sky" padding="md">
            <h2 className="text-h3">Not sure what to say?</h2>
            <p className="mt-2 text-ink-700">Write it down in the support chat. It's private.</p>
            <Button as={Link} to="/app/chat" variant="secondary" size="sm" className="mt-4">
              <MessageCircle aria-hidden="true" className="size-4" /> Open chat
            </Button>
          </Card>
        </div>
      )}
    </div>
  );
}
