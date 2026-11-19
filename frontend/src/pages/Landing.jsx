/** Public landing page (placeholder hero; the full page comes later). */
import { Link } from "react-router-dom";
import { Button, SectionBlob } from "../components/ui";

export default function Landing() {
  return (
    <section className="relative mx-auto max-w-content overflow-hidden px-4 py-16 md:px-6 md:py-24">
      <SectionBlob shape="blob" color="sun" float className="absolute -right-16 -top-8 size-64 opacity-60 md:size-96" />
      <SectionBlob shape="star" color="lilac" className="absolute bottom-10 right-1/3 size-10" />
      <div className="relative max-w-xl">
        <h1 className="text-display-sm md:text-display">A calmer mind, one day at a time.</h1>
        <p className="mt-6 text-ink-700">
          Small daily check-ins, a friendly space to talk, and an easy way to reach your campus counsellor.
        </p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Button as={Link} to="/register" size="lg">Get started</Button>
          <Button as={Link} to="/login" variant="secondary" size="lg">Log in</Button>
        </div>
      </div>
    </section>
  );
}
