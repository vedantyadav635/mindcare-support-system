/**
 * The landing page's product showcase. Each feature is its own full-width band (its own soft background),
 * with text on one side and a preview on the other, alternating left and right.
 * SHOWCASE gives the content and the band colour; ShowcaseRow draws one row.
 */
import { CalendarHeart, Check, LineChart, MessageCircle, SunMedium } from "lucide-react";
import { cx, SectionBlob } from "../ui";
import { BookingPreview, ChatPreview, CheckInPreview, TrendsPreview } from "./Previews";

export const SHOWCASE = [
  {
    id: "checkin", icon: SunMedium, bg: "bg-sun-soft", blob: "sun", Preview: CheckInPreview,
    title: "A minute a day to notice how you feel",
    text: "Answer a few gentle questions about your mood, stress and sleep. It's quick, and it's yours.",
    points: ["One simple question at a time", "Skip anything you'd rather not answer", "Change an answer any time that day"],
  },
  {
    id: "trends", icon: LineChart, bg: "bg-sky-soft", blob: "sky", Preview: TrendsPreview,
    title: "See what helps, and what doesn't",
    text: "Your check-ins turn into a clear picture of your week and month, with plain-language notes, never labels.",
    points: ["Mood, stress and sleep side by side", "Week and month views", "Gaps for days you skipped, never made-up numbers"],
  },
  {
    id: "chat", icon: MessageCircle, bg: "bg-lilac-soft", blob: "lilac", Preview: ChatPreview,
    title: "Someone to talk to, at any hour",
    text: "Write how you feel and get a warm, simple reply, plus small ideas picked for the moment.",
    points: ["An automated assistant, not a therapist", "Ideas that match how you feel", "Help numbers show up instantly if you may be in danger"],
  },
  {
    id: "booking", icon: CalendarHeart, bg: "bg-mint-soft", blob: "mint", Preview: BookingPreview,
    title: "Real people, when you want them",
    text: "See your campus counsellor's free times and book one in a few taps. You don't need a big reason.",
    points: ["Pick a day and a time that suits you", "Say why in a few words, in private", "Cancel any time"],
  },
];

export function ShowcaseRow({ row, index }) {
  const { icon: Icon, blob, Preview, title, text, points } = row;
  const flip = index % 2 === 1; // every second row has the preview on the left (on large screens)

  return (
    <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
      <div className={cx(flip && "lg:order-2")}>
        <span className="mb-6 flex size-16 items-center justify-center rounded-pill bg-surface shadow-soft">
          <Icon aria-hidden="true" className="size-8 text-ink-900" />
        </span>
        <h2 id={`showcase-${row.id}`} className="text-h2 md:text-h1 lg:text-[2.75rem] lg:leading-tight">{title}</h2>
        <p className="mt-5 max-w-lg text-ink-700 lg:text-lg">{text}</p>
        <ul className="mt-8 space-y-4">
          {points.map((point) => (
            <li key={point} className="flex items-start gap-3 text-ink-900">
              <span aria-hidden="true" className="mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-pill bg-brand-500"><Check className="size-4" /></span>
              {point}
            </li>
          ))}
        </ul>
      </div>

      <div className={cx("relative", flip && "lg:order-1")}>
        <SectionBlob shape="blob" color={blob} float className="absolute -right-8 -top-12 size-64 opacity-60" />
        <SectionBlob shape="ring" color="surface" className="absolute -bottom-8 -left-6 size-24 opacity-70" />
        <div className="relative mx-auto max-w-lg lg:scale-105"><Preview /></div>
      </div>
    </div>
  );
}
