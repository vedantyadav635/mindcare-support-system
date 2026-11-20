/**
 * HeroPreview: a stylised peek at the app for the landing hero: a check-in card with floating
 * streak, chat and sleep cards. Purely decorative and static (nothing here is clickable), so it is hidden
 * from screen readers. All colours are design tokens.
 */
import { Flame, Moon } from "lucide-react";
import { MOOD_EMOJI, MOOD_SWATCH } from "../checkin/mood";
import { cx, SectionBlob } from "../ui";

const SLEEP_BARS = [60, 85, 45, 90, 70, 100, 80]; // example heights (%)

export default function HeroPreview() {
  return (
    <div aria-hidden="true" className="relative mx-auto w-full max-w-md pb-16 pt-6 lg:max-w-lg lg:scale-110 lg:py-12">
      <SectionBlob shape="blob" color="sun" float className="absolute -right-6 top-0 size-72 opacity-60" />
      <SectionBlob shape="ring" color="lilac" className="absolute -left-4 bottom-10 size-24 opacity-70" />
      <SectionBlob shape="star" color="sky" className="absolute right-2 top-16 size-9" />

      {/* Main card: the daily check-in */}
      <div className="relative rounded-xl bg-surface p-6 shadow-lift">
        <p className="text-small font-semibold text-ink-700">Good morning, Asha</p>
        <p className="mt-1 font-heading text-h2 font-extrabold text-ink-900">How are you today?</p>
        <div className="mt-5 flex justify-between gap-1.5">
          {[1, 2, 3, 4, 5].map((value) => (
            <span
              key={value}
              className={cx(
                "flex size-12 items-center justify-center rounded-pill text-2xl",
                MOOD_SWATCH[value],
                value === 4 && "scale-110 ring-4 ring-brand-500 ring-offset-2 ring-offset-surface",
              )}
            >
              {MOOD_EMOJI[value]}
            </span>
          ))}
        </div>
        <div className="mt-5 rounded-pill bg-brand-500 py-3 text-center font-heading font-bold text-ink-900">Continue</div>
        <div className="mt-4 flex justify-center gap-2">
          {[0, 1, 2, 3, 4].map((i) => <span key={i} className={cx("h-2 rounded-pill", i === 1 ? "w-6 bg-brand-500" : i < 1 ? "w-2 bg-brand-500" : "w-2 bg-line")} />)}
        </div>
      </div>

      {/* Floating: streak */}
      <div className="absolute -top-1 right-0 flex animate-float items-center gap-2 rounded-pill bg-surface px-4 py-2.5 shadow-lift sm:-right-4">
        <Flame className="size-5 text-brand-500" />
        <span className="font-heading text-small font-bold text-ink-900">4-day streak</span>
      </div>

      {/* Floating: a chat reply */}
      <div className="absolute -bottom-0 left-0 flex max-w-[16rem] items-end gap-2 sm:-left-4">
        <span className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface shadow-soft">
          <SectionBlob shape="smile" color="mint" className="size-7" />
        </span>
        <p className="rounded-lg rounded-bl-sm bg-surface px-4 py-3 text-small text-ink-900 shadow-lift">That sounds heavy. I'm here to listen.</p>
      </div>

      {/* Floating: sleep */}
      <div className="absolute -bottom-2 right-0 w-36 rounded-lg bg-sky/30 p-3 shadow-lift backdrop-blur-sm sm:-right-4">
        <p className="flex items-center gap-1.5 text-small font-bold text-ink-900"><Moon className="size-4" /> Sleep 7.5 h</p>
        <div className="mt-2 flex h-10 items-end gap-1">
          {SLEEP_BARS.map((height, i) => <span key={i} style={{ height: `${height}%` }} className="flex-1 rounded-t-sm bg-sky" />)}
        </div>
      </div>
    </div>
  );
}
