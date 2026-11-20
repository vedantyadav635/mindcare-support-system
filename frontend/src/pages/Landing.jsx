/**
 * Public landing page. Sections alternate cream / sand / soft colour:
 *   hero (cream) -> needs (sand) -> features (cream) -> how it works (soft lilac) -> privacy (cream) -> footer (sand, in PublicLayout)
 */
import { HeartHandshake, LineChart, MessageCircle, Moon, ShieldCheck, Smile, SunMedium, Target, Wind } from "lucide-react";
import { Link } from "react-router-dom";
import HeroIllustration from "../components/HeroIllustration";
import { Button, Card, Chip, cx, SectionBlob } from "../components/ui";

const NEEDS = [
  ["Stress", Wind],
  ["Sleep", Moon],
  ["Focus", Target],
  ["Mood", Smile],
  ["Talk to someone", MessageCircle],
];

const FEATURES = [
  { icon: SunMedium, tint: "sun", title: "Daily check-in", text: "A minute each day to notice how you feel. A few gentle questions, no pressure, skip anything you like." },
  { icon: LineChart, tint: "sky", title: "Track your patterns", text: "See your mood, stress and sleep over the week and month, and spot what helps you feel better." },
  { icon: HeartHandshake, tint: "lilac", title: "Talk to a counsellor", text: "Book a private session with a campus counsellor in a few taps, whenever things feel like too much." },
];

const STEPS = [
  { title: "Create your account", text: "It takes a minute. We only ask what we need, and you choose to share." },
  { title: "Check in each day", text: "Answer a few simple questions about your mood, stress and sleep. Chat if you feel like talking." },
  { title: "Get support that fits", text: "Get small ideas picked for you, take a quick self-check, or book time with a counsellor." },
];

const PRIVACY_POINTS = [
  "Your check-ins and chats are private to you. Other students can never see them.",
  "This is a support tool, not a diagnosis. We never label you or tell you what is \"wrong\".",
  "Counsellors only see what they need: the reason you give when you book, and a short excerpt if our safety check thinks you may be at risk.",
  "You can delete your account and all your data whenever you want.",
];

/** One full-width band with a background and the standard spacing (py-16 on mobile, py-24 on desktop). */
function Band({ background, label, children, className }) {
  return (
    <section aria-labelledby={label} className={background}>
      <div className={cx("mx-auto max-w-content px-4 py-16 md:px-6 md:py-24", className)}>{children}</div>
    </section>
  );
}

export default function Landing() {
  return (
    <>
      {/* 1. Hero */}
      <Band background="bg-cream" label="hero-title" className="relative overflow-hidden">
        <div className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <h1 id="hero-title" className="text-display-sm md:text-display">A kinder way to look after your mind</h1>
            <p className="mt-6 max-w-lg text-ink-700">
              Check in with yourself every day, try simple self-help ideas, and talk to a counsellor when you want to.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button as={Link} to="/register" size="lg">Get started</Button>
              <Button as={Link} to="/login" variant="secondary" size="lg">Log in</Button>
            </div>
          </div>
          <HeroIllustration />
        </div>
      </Band>

      {/* 2. What do you need today? */}
      <Band background="bg-sand" label="needs-title" className="text-center">
        <h2 id="needs-title" className="text-h1">What do you need today?</h2>
        <p className="mx-auto mt-3 max-w-md text-ink-700">Pick what feels closest. We'll help you get started.</p>
        <ul className="mt-8 flex flex-wrap justify-center gap-3">
          {NEEDS.map(([label, icon]) => (
            <li key={label}><Chip as={Link} to="/register" size="md" icon={icon}>{label}</Chip></li>
          ))}
        </ul>
      </Band>

      {/* 3. Features */}
      <Band background="bg-cream" label="features-title">
        <h2 id="features-title" className="mb-10 text-center text-h1">Small steps, big difference</h2>
        <ul className="grid gap-6 md:grid-cols-3">
          {FEATURES.map(({ icon: Icon, tint, title, text }) => (
            <li key={title}>
              <Card tint={tint} hover className="h-full">
                <span className="mb-5 flex size-14 items-center justify-center rounded-pill bg-surface shadow-soft">
                  <Icon aria-hidden="true" className="size-7 text-ink-900" />
                </span>
                <h3>{title}</h3>
                <p className="mt-2 text-ink-700">{text}</p>
              </Card>
            </li>
          ))}
        </ul>
      </Band>

      {/* 4. How it works */}
      <Band background="bg-lilac/20" label="how-title" className="relative overflow-hidden">
        <SectionBlob shape="arc" color="lilac" className="absolute -right-6 top-6 size-32 opacity-60" />
        <h2 id="how-title" className="mb-10 text-center text-h1">How it works</h2>
        <ol className="grid gap-8 md:grid-cols-3">
          {STEPS.map(({ title, text }, index) => (
            <li key={title} className="text-center md:text-left">
              <span aria-hidden="true" className="mx-auto mb-4 flex size-14 items-center justify-center rounded-pill bg-brand-500 font-heading text-h3 font-extrabold text-ink-900 md:mx-0">
                {index + 1}
              </span>
              <h3>{title}</h3>
              <p className="mt-2 text-ink-700">{text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-12 text-center">
          <Button as={Link} to="/register" size="lg">Start your first check-in</Button>
        </div>
      </Band>

      {/* 5. Privacy promise */}
      <Band background="bg-cream" label="privacy-title">
        <Card tint="mint" className="relative overflow-hidden rounded-xl">
          <SectionBlob shape="blob" color="mint" className="absolute -right-10 -top-10 size-48 opacity-50" />
          <div className="relative grid gap-8 md:grid-cols-[auto_1fr] md:items-start">
            <span className="flex size-16 items-center justify-center rounded-pill bg-surface shadow-soft">
              <ShieldCheck aria-hidden="true" className="size-8 text-ink-900" />
            </span>
            <div>
              <h2 id="privacy-title" className="text-h1">Our privacy promise</h2>
              <ul className="mt-6 space-y-3">
                {PRIVACY_POINTS.map((point) => (
                  <li key={point} className="flex gap-3">
                    <span aria-hidden="true" className="mt-2.5 size-2.5 shrink-0 rounded-pill bg-success" />
                    <span className="text-ink-700">{point}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
      </Band>
    </>
  );
}
