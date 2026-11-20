/**
 * Login / register layout, as a full-height split screen.
 *   Desktop: the form on the left, a full-bleed coloured panel with shapes on the right (edge to edge).
 *   Mobile: one column (the panel is hidden, the form comes first).
 * <AuthSplit panel={{ tint: "lilac", title: "...", text: "..." }}> ...form card... </AuthSplit>
 */
import { SectionBlob } from "./ui";

// Solid soft backgrounds, so the panel runs edge to edge
const PANEL_TINTS = {
  lilac: "bg-gradient-to-br from-lilac-soft via-lilac-soft to-brand-100",
  mint: "bg-gradient-to-br from-mint-soft via-mint-soft to-sky-soft",
  sun: "bg-gradient-to-br from-sun-soft via-sun-soft to-brand-100",
};

export default function AuthSplit({ panel, children }) {
  return (
    <section className="grid min-h-[calc(100dvh-4.5rem)] pb-8 lg:grid-cols-2">
      <div className="flex items-center justify-center bg-gradient-to-br from-cream via-cream to-brand-50 px-4 py-10 md:px-10">
        <div className="w-full max-w-xl">{children}</div>
      </div>

      <aside aria-hidden="true" className={`relative hidden items-center justify-center overflow-hidden lg:flex ${PANEL_TINTS[panel.tint]}`}>
        <div className="absolute inset-0 bg-dots opacity-60" />
        <SectionBlob shape="blob" color="surface" float className="absolute -right-24 -top-24 size-96 opacity-40" />
        <SectionBlob shape="ring" color="sky" className="absolute -bottom-20 -left-16 size-72" />
        <SectionBlob shape="star" color="sun" className="absolute bottom-28 right-20 size-14" />
        <SectionBlob shape="arc" color="blush" className="absolute left-16 top-20 size-32" />
        <SectionBlob shape="circle" color="mint" className="absolute right-32 top-1/3 size-10" />
        <div className="relative flex max-w-sm flex-col items-center px-8 text-center">
          <SectionBlob shape="smile" color="orange" float className="mb-8 size-44" />
          <p className="font-heading text-h1 font-extrabold text-ink-900">{panel.title}</p>
          <p className="mt-4 text-ink-900 lg:text-lg">{panel.text}</p>
        </div>
      </aside>
    </section>
  );
}
