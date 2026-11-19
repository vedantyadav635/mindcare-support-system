import { cx } from "./cx";
import SectionBlob from "./SectionBlob";

/**
 * EmptyState: shown when a list has nothing in it yet. A small shape illustration, a title,
 * a gentle sentence and an optional action button.
 * <EmptyState title="No check-ins yet" text="Your first one takes a minute." action={<Button>Check in</Button>} />
 */
export default function EmptyState({ title, text, action, className }) {
  return (
    <div className={cx("flex flex-col items-center rounded-lg border-2 border-dashed border-line px-6 py-12 text-center", className)}>
      {/* Little scene: a smiling circle sitting on a soft blob with a star */}
      <div className="relative mb-6 size-28" aria-hidden="true">
        <SectionBlob shape="blob" color="sand" className="absolute inset-0" />
        <SectionBlob shape="smile" color="sun" className="absolute inset-5" />
        <SectionBlob shape="star" color="lilac" className="absolute -right-2 top-0 size-8" />
      </div>
      <h3>{title}</h3>
      {text && <p className="mt-2 max-w-sm text-ink-700">{text}</p>}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
