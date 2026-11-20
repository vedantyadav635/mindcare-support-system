/** /counsellor/alerts: crisis alerts, open ones first. Mark as seen, close, reopen, or schedule a session. */
import { RefreshCw } from "lucide-react";
import { useState } from "react";
import * as alertsApi from "../../api/alerts";
import AlertCard from "../../components/alerts/AlertCard";
import { FILTERS, sortAlerts } from "../../components/alerts/alertInfo";
import ErrorNotice from "../../components/ErrorNotice";
import { Button, Chip, EmptyState, PageHeader, Spinner, useToast } from "../../components/ui";
import { useAlertCount } from "../../context/AlertCountContext";
import useApi from "../../hooks/useApi";

const SUCCESS = { seen: "Marked as seen", closed: "Alert closed", open: "Alert reopened" };

// All alerts (any status); we sort and filter in the browser so the chips are instant
const loadAll = () => alertsApi.list();

export default function Alerts() {
  const toast = useToast();
  const list = useApi(loadAll);
  const sidebarCount = useAlertCount(); // { count, refresh }: the number the sidebar badge shows
  const [filter, setFilter] = useState("");
  const [busyId, setBusyId] = useState(null);

  async function changeStatus(alert, status) {
    setBusyId(alert.id);
    try {
      await alertsApi.update(alert.id, status);
      toast(SUCCESS[status]);
      await Promise.all([list.reload(), sidebarCount?.refresh()]);
    } catch (e) {
      toast(e.message, "error");
    }
    setBusyId(null);
  }

  const alerts = list.data ? sortAlerts(list.data) : [];
  const shown = filter ? alerts.filter((a) => a.status === filter) : alerts;
  const countOf = (status) => alerts.filter((a) => a.status === status).length;

  // The sidebar count is polled every minute; if it is higher than what this page shows, new alerts arrived
  const newAlerts = Math.max(0, (sidebarCount?.count ?? 0) - countOf("open"));

  return (
    <div>
      <PageHeader
        title="Crisis alerts"
        subtitle="Students whose words or answers suggested they may need support. Please reach out soon."
      />

      {newAlerts > 0 && (
        <div role="status" className="mb-6 flex flex-wrap items-center gap-3 rounded-md bg-brand-50 px-4 py-3 ring-2 ring-brand-300">
          <span className="flex-1 font-semibold text-ink-900">{newAlerts} new {newAlerts === 1 ? "alert has" : "alerts have"} arrived.</span>
          <Button size="sm" onClick={list.reload}><RefreshCw aria-hidden="true" className="size-4" /> Show</Button>
        </div>
      )}

      {list.loading ? (
        <div className="flex justify-center py-16 text-brand-500"><Spinner size="lg" label="Loading alerts" /></div>
      ) : list.error ? (
        <div className="max-w-md space-y-4">
          <ErrorNotice>{list.error}</ErrorNotice>
          <Button variant="secondary" onClick={list.reload}>Try again</Button>
        </div>
      ) : (
        <>
          <div role="group" aria-label="Filter by status" className="mb-6 flex flex-wrap gap-2">
            {FILTERS.map(([value, label]) => (
              <Chip key={value || "all"} selected={filter === value} onClick={() => setFilter(value)}>
                {label} ({value ? countOf(value) : alerts.length})
              </Chip>
            ))}
          </div>

          {shown.length === 0 ? (
            <EmptyState
              title={filter === "open" || !filter ? "No alerts right now" : "Nothing here"}
              text="When a student's words or answers suggest they may be at risk, it will appear here."
            />
          ) : (
            <ul className="space-y-4">
              {shown.map((alert) => (
                <li key={alert.id}><AlertCard alert={alert} onStatus={changeStatus} busy={busyId === alert.id} /></li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}
