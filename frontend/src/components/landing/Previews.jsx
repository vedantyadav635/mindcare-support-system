/**
 * Small static "screenshots" of the app for the landing page showcase. They are drawn with our own
 * tokens and labelled as examples (the data is made up). Hidden from screen readers: the text next to
 * each one already explains the feature.
 */
import { Check } from "lucide-react";
import MoodSparkline from "../charts/MoodSparkline";
import { Avatar, Badge, cx } from "../ui";

const Example = () => <p className="mt-3 text-center text-small text-ink-700">Example, not real data</p>;

const wrap = (children) => <div aria-hidden="true">{children}</div>;

export function CheckInPreview() {
  const options = ["Not at all", "A little", "Moderately"];
  return wrap(
    <>
      <div className="rounded-lg bg-surface p-6 shadow-lift">
        <div className="mb-4 flex justify-center gap-2">
          {[0, 1, 2, 3, 4, 5, 6].map((i) => <span key={i} className={cx("h-2.5 rounded-pill", i === 1 ? "w-7 bg-brand-500" : i < 1 ? "w-2.5 bg-brand-500" : "w-2.5 bg-line")} />)}
        </div>
        <p className="text-small font-semibold text-ink-700">Question 2 of 7</p>
        <p className="mt-1 font-heading text-h3 font-extrabold text-ink-900">How stressed do you feel today?</p>
        <ul className="mt-4 space-y-2">
          {options.map((label, i) => (
            <li key={label} className={cx("flex items-center justify-between rounded-md border-2 px-4 py-3", i === 1 ? "border-brand-500 bg-brand-50" : "border-line")}>
              <span className="font-heading font-bold text-ink-900">{label}</span>
              <span className={cx("flex size-5 items-center justify-center rounded-pill border-2", i === 1 ? "border-brand-500 bg-brand-500" : "border-line")}>
                {i === 1 && <span className="size-2 rounded-pill bg-ink-900" />}
              </span>
            </li>
          ))}
        </ul>
      </div>
      <Example />
    </>,
  );
}

const WEEK = [["Mon", 3], ["Tue", 4], ["Wed", 2], ["Thu", null], ["Fri", 4], ["Sat", 5], ["Sun", 4]].map(([label, mood]) => ({ label, full: label, mood }));

export function TrendsPreview() {
  return wrap(
    <>
      <div className="rounded-lg bg-surface p-6 shadow-lift">
        <div className="flex items-center justify-between">
          <p className="font-heading text-h3 font-extrabold text-ink-900">Your week</p>
          <Badge status="success">Mood up</Badge>
        </div>
        <MoodSparkline rows={WEEK} />
        <p className="mt-2 rounded-md bg-sand px-4 py-3 text-small text-ink-900">Your sleep averaged 7.2 hours, right in the 7 to 9 hours most people need.</p>
      </div>
      <Example />
    </>,
  );
}

export function ChatPreview() {
  return wrap(
    <>
      <div className="space-y-3 rounded-lg bg-surface p-6 shadow-lift">
        <p className="ml-auto w-fit max-w-[80%] rounded-lg rounded-br-sm bg-brand-500 px-4 py-3 text-ink-900">Exams are really getting to me.</p>
        <div className="flex items-end gap-2">
          <Avatar name="Support" size="sm" />
          <p className="max-w-[85%] rounded-lg rounded-bl-sm bg-sand px-4 py-3 text-ink-900">That sounds stressful. Would a one-minute breathing exercise help?</p>
        </div>
        <p className="ml-10 flex w-fit items-center gap-2 rounded-md bg-surface px-3 py-2 text-small font-semibold text-ink-900 ring-2 ring-line">
          <span className="flex size-7 items-center justify-center rounded-pill bg-brand-100">🌬️</span> Box breathing · tap to open
        </p>
      </div>
      <Example />
    </>,
  );
}

export function BookingPreview() {
  const days = [["Mon", 17], ["Tue", 18], ["Wed", 19], ["Thu", 20], ["Fri", 21]];
  const times = ["10:00 am", "2:00 pm", "4:30 pm"];
  return wrap(
    <>
      <div className="rounded-lg bg-surface p-6 shadow-lift">
        <div className="flex items-center gap-3">
          <Avatar name="Counsellor" size="lg" />
          <div>
            <p className="font-heading font-bold text-ink-900">Your campus counsellor</p>
            <p className="text-small text-ink-700">Anxiety and stress</p>
          </div>
        </div>
        <div className="mt-4 grid grid-cols-5 gap-1.5">
          {days.map(([name, date], i) => (
            <span key={name} className={cx("flex flex-col items-center rounded-md py-2", i === 3 ? "bg-ink-900 text-white" : "bg-surface ring-2 ring-line")}>
              <span className="text-small">{name}</span>
              <span className="font-heading font-extrabold">{date}</span>
            </span>
          ))}
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {times.map((time, i) => (
            <li key={time} className={cx("flex items-center gap-1.5 rounded-pill px-4 py-2 text-small font-semibold", i === 1 ? "bg-ink-900 text-white" : "bg-surface text-ink-900 ring-2 ring-line")}>
              {i === 1 && <Check className="size-4" />} {time}
            </li>
          ))}
        </ul>
      </div>
      <Example />
    </>,
  );
}
