import { cx } from "./cx";

/**
 * Tabs: switch between a few views of the same page (e.g. Upcoming | Past).
 * Arrow keys, Home and End move between tabs. Put the content in <TabPanel> with the same idPrefix.
 *
 * <Tabs idPrefix="appts" label="Appointments" value={tab} onChange={setTab}
 *       tabs={[{ id: "upcoming", label: "Upcoming", count: 2 }, { id: "past", label: "Past" }]} />
 * <TabPanel idPrefix="appts" value={tab}> ...content... </TabPanel>
 */
export default function Tabs({ label, tabs, value, onChange, idPrefix, className }) {
  function onKeyDown(event) {
    const index = tabs.findIndex((tab) => tab.id === value);
    const last = tabs.length - 1;
    const target =
      event.key === "ArrowRight" ? (index + 1) % tabs.length
      : event.key === "ArrowLeft" ? (index + last) % tabs.length
      : event.key === "Home" ? 0
      : event.key === "End" ? last
      : null;
    if (target === null) return;
    event.preventDefault();
    onChange(tabs[target].id);
    document.getElementById(`${idPrefix}-tab-${tabs[target].id}`)?.focus();
  }

  return (
    <div role="tablist" aria-label={label} onKeyDown={onKeyDown} className={cx("inline-flex rounded-pill bg-sand p-1", className)}>
      {tabs.map((tab) => {
        const selected = tab.id === value;
        return (
          <button
            key={tab.id}
            id={`${idPrefix}-tab-${tab.id}`}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`${idPrefix}-panel`}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(tab.id)}
            className={cx(
              "flex min-h-10 items-center gap-2 rounded-pill px-5 py-2 font-heading font-bold transition",
              selected ? "bg-surface text-ink-900 shadow-soft" : "text-ink-700 hover:text-ink-900",
            )}
          >
            {tab.label}
            {tab.count !== undefined && (
              <span className={cx("rounded-pill px-2 text-small", selected ? "bg-brand-100" : "bg-line")}>{tab.count}</span>
            )}
          </button>
        );
      })}
    </div>
  );
}

export function TabPanel({ idPrefix, value, className, children }) {
  return (
    <div role="tabpanel" id={`${idPrefix}-panel`} aria-labelledby={`${idPrefix}-tab-${value}`} className={className}>
      {children}
    </div>
  );
}
