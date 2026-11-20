/**
 * Login / register layout.
 *   Desktop: form card on the left, a soft coloured panel with shapes on the right.
 *   Mobile: one column (the panel is hidden, the form comes first).
 * <AuthSplit panel={{ tint: "lilac", title: "...", text: "..." }}> ...form card... </AuthSplit>
 */
import { SectionBlob } from "./ui";

const PANEL_TINTS = { lilac: "bg-lilac/25", mint: "bg-mint/25", sun: "bg-sun/30" };

export default function AuthSplit({ panel, children }) {
  return (
    <section className="mx-auto grid max-w-content items-stretch gap-8 px-4 py-10 md:px-6 md:py-16 lg:grid-cols-2">
      <div className="mx-auto w-full max-w-xl self-center">{children}</div>

      <aside aria-hidden="true" className={`relative hidden min-h-[32rem] overflow-hidden rounded-xl lg:block ${PANEL_TINTS[panel.tint]}`}>
        <SectionBlob shape="blob" color="brand" float className="absolute -right-12 -top-12 size-64 opacity-70" />
        <SectionBlob shape="ring" color="sky" className="absolute -bottom-10 -left-10 size-56" />
        <SectionBlob shape="star" color="sun" className="absolute bottom-24 right-16 size-12" />
        <SectionBlob shape="arc" color="blush" className="absolute left-12 top-16 size-28" />
        <SectionBlob shape="circle" color="mint" className="absolute right-24 top-1/2 size-10" />
        <div className="relative flex h-full flex-col items-center justify-center px-12 text-center">
          <SectionBlob shape="smile" color="orange" float className="mb-8 size-36" />
          <p className="font-heading text-h2 font-extrabold text-ink-900">{panel.title}</p>
          <p className="mt-3 max-w-xs text-ink-700">{panel.text}</p>
        </div>
      </aside>
    </section>
  );
}
