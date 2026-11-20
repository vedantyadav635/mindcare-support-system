/**
 * CallButtons: tap-to-call links for crisis help. Real <a href="tel:..."> links, so phones dial directly.
 *   size "lg": big full-width buttons (crisis screen)    size "sm": compact pills (inside the chat)
 * Calm, not alarming: dark text on soft colours, no red.
 */
import { Phone } from "lucide-react";
import { telHref } from "../../utils/format";
import { cx } from "../ui";

export default function CallButtons({ options, size = "lg" }) {
  if (size === "sm") {
    return (
      <ul className="flex flex-wrap gap-2">
        {options.map((o) => (
          <li key={o.id}>
            <a
              href={telHref(o.number)}
              aria-label={`Call ${o.label} on ${o.number}`}
              className="inline-flex min-h-11 items-center gap-2 rounded-pill bg-brand-500 px-4 font-heading font-bold text-ink-900 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift"
            >
              <Phone aria-hidden="true" className="size-4" /> {o.label} {o.number}
            </a>
          </li>
        ))}
      </ul>
    );
  }

  return (
    <ul className="space-y-3">
      {options.map((o, index) => (
        <li key={o.id}>
          <a
            href={telHref(o.number)}
            aria-label={`Call ${o.label} on ${o.number}${o.note ? `. ${o.note}` : ""}`}
            className={cx(
              "flex min-h-20 items-center gap-4 rounded-lg px-5 py-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift",
              // the first (main) helpline stands out in the accent colour; the rest are white
              index === 0 ? "bg-brand-500" : "bg-surface ring-2 ring-line",
            )}
          >
            <span aria-hidden="true" className={cx("flex size-12 shrink-0 items-center justify-center rounded-pill", index === 0 ? "bg-surface" : "bg-brand-100")}>
              <Phone className="size-6 text-ink-900" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block font-heading font-bold text-ink-900">{o.label}</span>
              <span className="block font-heading text-h2 font-extrabold tracking-wide text-ink-900">{o.number}</span>
              {o.note && <span className="block text-small text-ink-900">{o.note}</span>}
            </span>
            <span aria-hidden="true" className="hidden font-heading font-bold text-ink-900 sm:block">Call</span>
          </a>
        </li>
      ))}
    </ul>
  );
}
