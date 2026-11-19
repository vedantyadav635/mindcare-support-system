/** Temporary page body used until a route gets its real screen. */
import { Disclaimer, EmptyState, PageHeader } from "./ui";

export default function PlaceholderPage({ title, subtitle, disclaimer = false, children }) {
  return (
    <>
      <PageHeader title={title} subtitle={subtitle} />
      {disclaimer && <Disclaimer className="mb-6" />}
      {children ?? <EmptyState title="Coming soon" text="This screen is being built. Navigation already works." />}
    </>
  );
}
