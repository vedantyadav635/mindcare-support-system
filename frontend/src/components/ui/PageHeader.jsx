import { cx } from "./cx";

/**
 * PageHeader: the page's single <h1>, an optional subtitle and an optional action on the right.
 * <PageHeader title="Your week" subtitle="How things have been going" action={<Button>Check in</Button>} />
 */
export default function PageHeader({ title, subtitle, action, className }) {
  return (
    <header className={cx("mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between", className)}>
      <div>
        <h1>{title}</h1>
        {subtitle && <p className="mt-2 max-w-2xl text-ink-700">{subtitle}</p>}
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </header>
  );
}
