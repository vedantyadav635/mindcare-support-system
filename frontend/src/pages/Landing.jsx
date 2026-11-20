/**
 * Public landing page, built as full-width bands. Each band has its own matching background and
 * overlaps the one above with a rounded top, so the page flows from top to bottom:
 *
 *   hero (peach > lilac) > needs (sand) > intro (cream) > 4 showcase bands (sun, sky, lilac, mint)
 *   > how it works (cream + dots) > help (peach) > privacy (blush) > FAQ (sand) > call to action (orange)
 *
 * Content uses the wide container (80rem). The pictures are drawn with our own components and labelled
 * as examples; there are no invented numbers or testimonials.
 */
import { ChevronDown, HeartHandshake, MessageCircle, Moon, Phone, ShieldCheck, Smile, Target, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import CallButtons from "../components/crisis/CallButtons";
import { callOptions } from "../components/crisis/helplines";
import Faq from "../components/landing/Faq";
import HeroPreview from "../components/landing/HeroPreview";
import { SHOWCASE, ShowcaseRow } from "../components/landing/Showcase";
import { Button, Chip, cx, SectionBlob } from "../components/ui";

const NEEDS = [
  ["Stress", Wind],
  ["Sleep", Moon],
  ["Focus", Target],
  ["Mood", Smile],
  ["Talk to someone", MessageCircle],
];

const STEPS = [
  { title: "Create your account", text: "It takes a minute. We only ask what we need, and you choose to share." },
  { title: "Check in each day", text: "Answer a few simple questions about your mood, stress and sleep. Chat if you feel like talking." },
  { title: "Get support that fits", text: "Get small ideas picked for you, take a quick self-check, or book time with a counsellor." },
];

const PRIVACY_POINTS = [
  ["Private to you", "Your check-ins and chats are never shown to other students."],
  ["Support, not a diagnosis", "We never label you or tell you what is \"wrong\"."],
  ["Counsellors see only what they need", "The reason you give when you book, and a short excerpt if our safety check thinks you may be at risk."],
  ["Yours to delete", "You can delete your account and all your data whenever you want."],
];

const TRUST = [
  [ShieldCheck, "Private to you"],
  [HeartHandshake, "Support, not diagnosis"],
  [Phone, "Help numbers one tap away"],
];

/**
 * One full-width band. `bg` is its background; everything after the first band overlaps the previous one
 * with a rounded top. `decor` is a full-width background layer. `ariaLabel` or `labelledBy` names the section.
 */
function Band({ bg, labelledBy, ariaLabel, first = false, decor, children, className, innerClassName }) {
  return (
    <section
      aria-labelledby={labelledBy}
      aria-label={ariaLabel}
      className={cx("relative overflow-hidden", bg, !first && "-mt-8 rounded-t-xl", className)}
    >
      {/* decor: shapes and patterns that span the WHOLE band width (not just the content column) */}
      {decor && <div aria-hidden="true" className="pointer-events-none absolute inset-0">{decor}</div>}
      <div className={cx("relative mx-auto w-full max-w-wide px-4 py-20 md:px-8 md:py-28 lg:px-12", innerClassName)}>{children}</div>
    </section>
  );
}

const SectionTitle = ({ id, children, text }) => (
  <div className="mx-auto mb-14 max-w-2xl text-center">
    <h2 id={id} className="text-h1 lg:text-[2.75rem] lg:leading-tight">{children}</h2>
    {text && <p className="mt-4 text-ink-700 lg:text-lg">{text}</p>}
  </div>
);

export default function Landing() {
  return (
    <>
      {/* 1. Hero: fills the first screen */}
      <Band
        first
        labelledBy="hero-title"
        bg="bg-gradient-to-br from-brand-100 via-brand-50 to-lilac-soft"
        decor={
          <>
            <div className="absolute inset-0 bg-dots opacity-70 [mask-image:linear-gradient(to_bottom,black,transparent_85%)]" />
            <SectionBlob shape="blob" color="sun" float className="absolute -right-32 -top-24 size-[34rem] opacity-40" />
            <SectionBlob shape="ring" color="lilac" className="absolute -bottom-40 -left-28 size-80 opacity-50" />
            <SectionBlob shape="star" color="sky" className="absolute left-[3%] top-[30%] hidden size-10 lg:block" />
            <SectionBlob shape="arc" color="mint" className="absolute bottom-[14%] right-[4%] hidden size-24 lg:block" />
          </>
        }
        className="flex min-h-[100dvh] items-center"
        innerClassName="!pt-32 !pb-24 md:!pt-36"
      >
        <div className="relative grid items-center gap-16 lg:grid-cols-[1.05fr_1fr] lg:gap-20">
          <div className="animate-fade-up">
            <p className="mb-6 inline-flex items-center gap-2 rounded-pill bg-surface px-4 py-2 text-small font-semibold text-ink-900 shadow-soft">
              <SectionBlob shape="smile" color="orange" className="size-5" /> Made for students
            </p>
            <h1 id="hero-title" className="text-display-sm md:text-display lg:text-hero">A kinder way to look after your mind</h1>
            <p className="mt-7 max-w-xl text-ink-900 lg:text-lg">
              Check in with yourself every day, try simple self-help ideas, and talk to a counsellor when you want to.
            </p>
            <div className="mt-9 flex flex-wrap gap-3">
              <Button as={Link} to="/register" size="lg">Get started</Button>
              <Button as={Link} to="/login" variant="secondary" size="lg">Log in</Button>
            </div>
            <ul className="mt-12 flex flex-wrap gap-x-8 gap-y-3">
              {TRUST.map(([Icon, label]) => (
                <li key={label} className="flex items-center gap-2 text-small font-semibold text-ink-900">
                  <Icon aria-hidden="true" className="size-5" /> {label}
                </li>
              ))}
            </ul>
          </div>
          <HeroPreview />
        </div>

        <a href="#needs" aria-label="Scroll to the next section" className="absolute bottom-6 left-1/2 hidden -translate-x-1/2 animate-bounce rounded-pill bg-surface p-2 shadow-soft lg:block">
          <ChevronDown aria-hidden="true" className="size-6" />
        </a>

      </Band>

      {/* 2. What do you need today? */}
      <Band bg="bg-sand" labelledBy="needs-title" innerClassName="text-center !py-16 md:!py-20">
        <span id="needs" />
        <h2 id="needs-title" className="text-h1 lg:text-[2.75rem]">What do you need today?</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-700">Pick what feels closest. We'll help you get started.</p>
        <ul className="mt-9 flex flex-wrap justify-center gap-3">
          {NEEDS.map(([label, icon]) => (
            <li key={label}><Chip as={Link} to="/register" size="md" icon={icon}>{label}</Chip></li>
          ))}
        </ul>
      </Band>

      {/* 3. Intro to the showcase */}
      <Band bg="bg-cream" labelledBy="showcase-title" innerClassName="!pb-12 md:!pb-16">
        <SectionTitle id="showcase-title" text="Small steps, one screen at a time. Here's a peek at what you'll find inside.">
          Everything in one calm place
        </SectionTitle>
      </Band>

      {/* 4. The four showcase bands, each with its own colour */}
      {SHOWCASE.map((row, index) => (
        <Band key={row.id} bg={row.bg} labelledBy={`showcase-${row.id}`}>
          <ShowcaseRow row={row} index={index} />
        </Band>
      ))}

      {/* 5. How it works */}
      <Band
        bg="bg-cream"
        labelledBy="how-title"
        decor={
          <>
            <div className="absolute inset-0 bg-dots opacity-60" />
            <SectionBlob shape="arc" color="lilac" className="absolute right-[6%] top-10 size-32 opacity-60" />
            <SectionBlob shape="star" color="sun" className="absolute bottom-16 left-[5%] size-10" />
          </>
        }
      >
        <div className="relative">
          <SectionTitle id="how-title">How it works</SectionTitle>
          <ol className="grid gap-8 md:grid-cols-3">
            {STEPS.map(({ title, text }, index) => (
              <li key={title} className="rounded-xl bg-surface p-8 shadow-lift">
                <span aria-hidden="true" className="mb-5 flex size-16 items-center justify-center rounded-pill bg-brand-500 font-heading text-h2 font-extrabold text-ink-900">
                  {index + 1}
                </span>
                <h3>{title}</h3>
                <p className="mt-3 text-ink-700">{text}</p>
              </li>
            ))}
          </ol>
          <div className="mt-12 text-center"><Button as={Link} to="/register" size="lg">Start your first check-in</Button></div>
        </div>
      </Band>

      {/* 6. Help is one tap away */}
      <Band
        bg="bg-brand-100"
        labelledBy="help-title"
        decor={<SectionBlob shape="blob" color="surface" float className="absolute -left-24 -top-20 size-80 opacity-40" />}
      >
        <div className="relative grid items-center gap-12 lg:grid-cols-2 lg:gap-24">
          <div>
            <h2 id="help-title" className="text-h1 lg:text-[2.75rem] lg:leading-tight">If things feel like too much, help is a call away</h2>
            <p className="mt-5 max-w-lg text-ink-900 lg:text-lg">
              These numbers are free and open day and night. You don't need an account to use them.
            </p>
            <Button as={Link} to="/help" variant="secondary" className="mt-8">Open the help page</Button>
          </div>
          <div className="mx-auto w-full max-w-md"><CallButtons options={callOptions(null).options} /></div>
        </div>
      </Band>

      {/* 7. Privacy promise */}
      <Band
        bg="bg-blush-soft"
        labelledBy="privacy-title"
        decor={
          <>
            <SectionBlob shape="ring" color="blush" className="absolute -bottom-20 -right-16 size-72 opacity-50" />
            <SectionBlob shape="circle" color="mint" className="absolute left-[4%] top-14 size-8 opacity-70" />
          </>
        }
      >
        <div className="relative">
          <SectionTitle id="privacy-title">Our privacy promise</SectionTitle>
          <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {PRIVACY_POINTS.map(([title, text]) => (
              <li key={title} className="rounded-xl bg-surface p-6 shadow-soft">
                <span aria-hidden="true" className="mb-4 flex size-12 items-center justify-center rounded-pill bg-mint-soft"><ShieldCheck className="size-6 text-ink-900" /></span>
                <h3 className="text-body font-extrabold">{title}</h3>
                <p className="mt-2 text-ink-700">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </Band>

      {/* 8. FAQ */}
      <Band bg="bg-sand" labelledBy="faq-title">
        <SectionTitle id="faq-title">Questions you might have</SectionTitle>
        <Faq />
      </Band>

      {/* 9. Final call to action: one bold orange band (dark text on orange keeps AA contrast) */}
      <Band
        bg="bg-brand-500"
        labelledBy="cta-title"
        innerClassName="text-center"
        decor={
          <>
            <SectionBlob shape="star" color="sun" className="absolute left-[8%] top-12 size-12" />
            <SectionBlob shape="ring" color="surface" className="absolute -bottom-16 right-[4%] size-56 opacity-60" />
            <SectionBlob shape="arc" color="lilac" className="absolute bottom-16 left-[6%] hidden size-24 lg:block" />
            <SectionBlob shape="blob" color="sun" className="absolute -left-24 -top-24 size-72 opacity-30" />
          </>
        }
      >
        <SectionBlob shape="smile" color="sun" float className="relative mx-auto mb-8 size-28" />
        <h2 id="cta-title" className="relative text-h1 text-ink-900 lg:text-[3rem]">Ready for your first check-in?</h2>
        <p className="relative mx-auto mt-4 max-w-md text-ink-900 lg:text-lg">It takes about a minute. You can stop any time.</p>
        <div className="relative mt-10 flex flex-wrap justify-center gap-3">
          <Button as={Link} to="/register" variant="secondary" size="lg" className="!border-surface">Get started</Button>
          <Button as={Link} to="/login" variant="ghost" size="lg" className="hover:!bg-brand-300">I already have an account</Button>
        </div>
      </Band>
    </>
  );
}
