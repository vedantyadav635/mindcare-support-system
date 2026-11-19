/**
 * /design: a living style guide (development only, not in the production build).
 * Shows every token and component so we can check the look in one place.
 */
import { Heart, Moon, Wind } from "lucide-react";
import { useState } from "react";
import {
  Avatar, Badge, Button, Card, Chip, Disclaimer, EmptyState, FormField, Input, Modal,
  OptionCard, PageHeader, SectionBlob, Select, Spinner, TextArea, useToast,
} from "../components/ui";
import { APP_NAME } from "../config";

// Full class names written out so Tailwind generates them
const COLOR_GROUPS = [
  ["Brand orange", [
    ["brand-50", "bg-brand-50", "#FFF4EA"], ["brand-100", "bg-brand-100", "#FFE3C7"], ["brand-300", "bg-brand-300", "#FFB070"],
    ["brand-500 · primary", "bg-brand-500", "#FF7A1A"], ["brand-600 · pressed", "bg-brand-600", "#E8650A"], ["brand-700 · small text", "bg-brand-700", "#C25206"],
  ]],
  ["Surfaces", [["cream · page", "bg-cream", "#FFF9F2"], ["surface · cards", "bg-surface", "#FFFFFF"], ["sand · sections", "bg-sand", "#F7EDE2"]]],
  ["Ink and lines", [["ink-900 · headings", "bg-ink-900", "#2B2A33"], ["ink-700 · body", "bg-ink-700", "#4A4855"], ["ink-500 · icons only", "bg-ink-500", "#7A7787"], ["line · borders", "bg-line", "#EDE4DA"]]],
  ["Soft accents", [["sky", "bg-sky", "#8FC6F2"], ["lilac", "bg-lilac", "#B9A6F5"], ["mint", "bg-mint", "#8ED9B5"], ["sun", "bg-sun", "#FFD25E"], ["blush", "bg-blush", "#FFA9B9"]]],
  ["Status", [["success", "bg-success", "#2E9E6B"], ["warning", "bg-warning", "#E8A317"], ["danger · crisis/errors", "bg-danger", "#D64545"]]],
  ["Mood scale 1 → 5", [["1 very low", "bg-mood-1", "#B9A6F5"], ["2 low", "bg-mood-2", "#8FC6F2"], ["3 okay", "bg-mood-3", "#FFD25E"], ["4 good", "bg-mood-4", "#FFB070"], ["5 very good", "bg-mood-5", "#8ED9B5"]]],
];

const TYPE_SCALE = [
  ["display", "font-heading text-display-sm text-ink-900 md:text-display", "A calmer mind"],
  ["h1 · 36/44", "font-heading text-h1 text-ink-900", "Your week"],
  ["h2 · 28/36", "font-heading text-h2 text-ink-900", "Picked for you"],
  ["h3 · 22/30", "font-heading text-h3 text-ink-900", "Box breathing"],
  ["body · 17/28", "text-body", "Small daily check-ins and a friendly space to talk."],
  ["small · 14/20", "text-small", "Helper text, captions and badges."],
];

const RADII = [["sm 10", "rounded-sm"], ["md 16", "rounded-md"], ["lg 24 · cards", "rounded-lg"], ["xl 32 · hero", "rounded-xl"], ["pill", "rounded-pill"]];
const ACCENTS = ["brand", "sky", "lilac", "mint", "sun", "blush"];
const SHAPES = ["blob", "circle", "ring", "arc", "star", "smile"];
const MOODS = [[1, "😞", "Very low"], [2, "🙁", "Low"], [3, "😐", "Okay"], [4, "🙂", "Good"], [5, "😄", "Very good"]];
const TINTS = ["none", "brand", "sky", "lilac", "mint", "sun", "blush", "sand"];

function Section({ title, children }) {
  return (
    <section className="border-t border-line py-12">
      <h2 className="mb-6">{title}</h2>
      {children}
    </section>
  );
}

export default function DesignSystem() {
  const toast = useToast();
  const [modalOpen, setModalOpen] = useState(false);
  const [mood, setMood] = useState(4);
  const [topics, setTopics] = useState(["sleep"]);
  const [note, setNote] = useState("Exams next week, feeling a bit nervous.");
  const [email, setEmail] = useState("not-an-email");

  const toggleTopic = (t) => setTopics((all) => (all.includes(t) ? all.filter((x) => x !== t) : [...all, t]));

  return (
    <main className="mx-auto max-w-content px-4 py-16 md:px-6">
      {/* Hero panel with decoration */}
      <div className="relative mb-12 overflow-hidden rounded-xl bg-brand-50 p-8 md:p-12">
        <SectionBlob shape="blob" color="sun" float className="absolute -right-10 -top-10 size-48 opacity-70" />
        <SectionBlob shape="star" color="lilac" className="absolute bottom-6 right-24 size-10" />
        <SectionBlob shape="ring" color="sky" float className="absolute -bottom-10 right-4 size-32 opacity-80" />
        <div className="relative max-w-xl">
          <p className="mb-2 font-heading font-bold text-brand-700">Dev only</p>
          <h1 className="text-display-sm md:text-display">{APP_NAME} design system</h1>
          <p className="mt-4 text-ink-700">Every token and component in one place. If something looks off here, it looks off everywhere.</p>
        </div>
      </div>

      <Section title="Colours">
        <div className="space-y-8">
          {COLOR_GROUPS.map(([group, colors]) => (
            <div key={group}>
              <h3 className="mb-3">{group}</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
                {colors.map(([name, cls, hex]) => (
                  <div key={name}>
                    <div className={`h-20 rounded-md ring-1 ring-line ${cls}`} />
                    <p className="mt-2 text-small font-semibold text-ink-900">{name}</p>
                    <p className="text-small text-ink-700">{hex}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Typography">
        <p className="mb-6 text-ink-700">Headings: Nunito 700/800. Body: Nunito Sans 400/600.</p>
        <div className="space-y-5">
          {TYPE_SCALE.map(([name, cls, sample]) => (
            <div key={name} className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:gap-6">
              <span className="w-32 shrink-0 text-small text-ink-700">{name}</span>
              <span className={cls}>{sample}</span>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Radius and shadow">
        <div className="flex flex-wrap gap-6">
          {RADII.map(([name, cls]) => (
            <div key={name} className="text-center">
              <div className={`size-20 bg-brand-100 ${cls}`} />
              <p className="mt-2 text-small">{name}</p>
            </div>
          ))}
          <div className="text-center"><div className="size-20 rounded-lg bg-surface shadow-soft" /><p className="mt-2 text-small">shadow-soft</p></div>
          <div className="text-center"><div className="size-20 rounded-lg bg-surface shadow-lift" /><p className="mt-2 text-small">shadow-lift</p></div>
        </div>
      </Section>

      <Section title="Buttons">
        <div className="space-y-4">
          {["primary", "secondary", "ghost", "danger"].map((variant) => (
            <div key={variant} className="flex flex-wrap items-center gap-3">
              <span className="w-24 text-small text-ink-700">{variant}</span>
              <Button variant={variant} size="sm">Small</Button>
              <Button variant={variant}>Medium</Button>
              <Button variant={variant} size="lg">Large</Button>
              <Button variant={variant} loading>Saving</Button>
              <Button variant={variant} disabled>Disabled</Button>
            </div>
          ))}
          <div className="flex flex-wrap items-center gap-3">
            <span className="w-24 text-small text-ink-700">with icon</span>
            <Button><Heart aria-hidden="true" className="size-5" /> Check in now</Button>
          </div>
        </div>
      </Section>

      <Section title="Cards">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {TINTS.map((tint) => (
            <Card key={tint} tint={tint} hover>
              <h3>tint="{tint}"</h3>
              <p className="mt-2 text-ink-700">Large rounded card with a soft shadow.</p>
            </Card>
          ))}
        </div>
      </Section>

      <Section title="Form controls">
        <form className="grid max-w-3xl gap-6 md:grid-cols-2" onSubmit={(e) => e.preventDefault()}>
          <FormField label="Full name" hint="As on your college ID">
            <Input placeholder="Asha Patel" />
          </FormField>
          <FormField label="Email" error={email.includes("@") ? undefined : "Please enter a valid email address"}>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField label="Year of study">
            <Select defaultValue="2">
              {[1, 2, 3, 4].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
          </FormField>
          <FormField label="Disabled field">
            <Input disabled value="Can't edit this" readOnly />
          </FormField>
          <FormField label="What is on your mind today?" optional className="md:col-span-2">
            <TextArea maxLength={300} value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
        </form>
      </Section>

      <Section title="Chips">
        <div className="flex flex-wrap gap-2">
          {[["sleep", Moon], ["stress", Wind], ["low mood", Heart]].map(([t, Icon]) => (
            <Chip key={t} icon={Icon} selected={topics.includes(t)} onClick={() => toggleTopic(t)}>{t}</Chip>
          ))}
          <Chip>plain tag</Chip>
        </div>
      </Section>

      <Section title="Option cards (answers)">
        <fieldset className="max-w-xl">
          <legend className="mb-4 font-heading text-h3 text-ink-900">How is your mood today?</legend>
          <div className="grid gap-3">
            {MOODS.map(([value, emoji, label]) => (
              <OptionCard key={value} name="mood-demo" value={value} checked={mood === value} onChange={() => setMood(value)} emoji={emoji} label={label} />
            ))}
          </div>
        </fieldset>
      </Section>

      <Section title="Badges and avatars">
        <div className="flex flex-wrap gap-3">
          <Badge status="success">Confirmed</Badge>
          <Badge status="warning">Requested</Badge>
          <Badge status="danger">Open alert</Badge>
          <Badge status="info">Completed</Badge>
          <Badge status="brand">New</Badge>
          <Badge status="neutral">Cancelled</Badge>
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <Avatar name="Asha Patel" size="sm" />
          <Avatar name="Dr. Meera Rao" />
          <Avatar name="Rahul Verma" size="lg" />
          <Avatar name="Zoya" size="lg" />
        </div>
      </Section>

      <Section title="Feedback">
        <div className="flex flex-wrap items-center gap-6">
          <Spinner size="sm" />
          <Spinner />
          <Spinner size="lg" className="text-brand-500" />
          <Button variant="secondary" onClick={() => setModalOpen(true)}>Open modal</Button>
          <Button variant="secondary" onClick={() => toast("Check-in saved")}>Success toast</Button>
          <Button variant="secondary" onClick={() => toast("Couldn't reach the server", "error")}>Error toast</Button>
          <Button variant="secondary" onClick={() => toast("Your counsellor confirmed the session", "info")}>Info toast</Button>
        </div>
        <Modal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          title="A gentle modal"
          footer={<><Button variant="ghost" onClick={() => setModalOpen(false)}>Cancel</Button><Button onClick={() => setModalOpen(false)}>Got it</Button></>}
        >
          <p>Press Escape, click outside, or use the buttons to close. Focus stays inside while it is open.</p>
        </Modal>
      </Section>

      <Section title="Empty state, page header, disclaimer">
        <div className="space-y-8">
          <Card><PageHeader className="!mb-0" title="Your appointments" subtitle="Confidential, friendly, and you don't need a big reason." action={<Button>Book a session</Button>} /></Card>
          <EmptyState title="No check-ins yet" text="Your first check-in takes about a minute." action={<Button>Check in now</Button>} />
          <Disclaimer />
        </div>
      </Section>

      <Section title="Decorative shapes (SectionBlob)">
        <div className="grid grid-cols-3 gap-6 sm:grid-cols-6">
          {SHAPES.map((shape, i) => (
            <div key={shape} className="text-center">
              <SectionBlob shape={shape} color={ACCENTS[i % ACCENTS.length]} className="mx-auto size-20" />
              <p className="mt-2 text-small">{shape}</p>
            </div>
          ))}
        </div>
      </Section>

      <Section title="Accessibility rules for these colours">
        <ul className="list-disc space-y-2 pl-6 text-ink-700">
          <li>Primary buttons use <strong>dark text on orange</strong> (white on orange fails contrast).</li>
          <li>Helper and muted text use <strong>ink-700</strong>. ink-500 is only for icons, borders and disabled states.</li>
          <li>Small orange text: <strong>brand-700 on white</strong> only. Links are ink-900 with an orange underline.</li>
          <li>Status colours appear as dots, borders and icons next to dark text, never as the text itself.</li>
          <li>Everything must work with the keyboard: Tab through this page to check the focus rings.</li>
        </ul>
      </Section>
    </main>
  );
}
