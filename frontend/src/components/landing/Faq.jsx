/** Frequently asked questions: native <details> (keyboard and screen-reader friendly, no JavaScript needed). */
import { ChevronDown } from "lucide-react";

const QUESTIONS = [
  ["Is this therapy, or a diagnosis?", "No. It is a support tool for noticing how you feel and finding help. It never diagnoses anything. Only a qualified professional can assess your mental health."],
  ["Who can see my answers?", "Your check-ins and chats are private to you. A counsellor sees only what they need: the reason you give when you book a session, and a short excerpt if our safety check thinks you may be at risk."],
  ["What if I feel I might hurt myself?", "Please reach out right now. Call Tele-MANAS on 14416 (free, 24x7) or 112 in an emergency. The help page has these numbers and needs no login, and the app shows them straight away if your words suggest you may be in danger."],
  ["Is the chat a real person?", "No. It is an automated assistant that replies with warm, simple messages and suggests ideas. When you want a person, you can book your campus counsellor."],
  ["Can I delete my data?", "Yes. You can ask to delete your account and everything stored with it, and it is removed for good."],
];

export default function Faq() {
  return (
    <div className="mx-auto max-w-3xl divide-y divide-line overflow-hidden rounded-lg bg-surface shadow-soft">
      {QUESTIONS.map(([question, answer]) => (
        <details key={question} className="group p-6">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md font-heading text-h3 font-bold text-ink-900 [&::-webkit-details-marker]:hidden">
            {question}
            <ChevronDown aria-hidden="true" className="size-6 shrink-0 transition group-open:rotate-180" />
          </summary>
          <p className="mt-3 text-ink-700">{answer}</p>
        </details>
      ))}
    </div>
  );
}
