/**
 * The number of OPEN crisis alerts, for the sidebar badge (counsellors only).
 *   const alerts = useAlertCount();   // { count, refresh } for counsellors, null for everyone else
 * It asks the server every 60 seconds (and when the tab becomes visible again). The alerts page calls
 * refresh() right after a change, so the badge never lags behind what the counsellor just did.
 * A failed check keeps the last known number: a hiccup must never hide alerts.
 */
import { createContext, useCallback, useContext, useEffect, useState } from "react";
import * as alertsApi from "../api/alerts";

const AlertCountContext = createContext(null);
const POLL_MS = 60_000;

export function AlertCountProvider({ enabled, children }) {
  const [count, setCount] = useState(null); // null = not known yet

  const refresh = useCallback(
    () => alertsApi.list("open").then((alerts) => setCount(alerts.length)).catch(() => {}),
    [],
  );

  useEffect(() => {
    if (!enabled) return;
    refresh();
    const onVisible = () => !document.hidden && refresh();
    const timer = setInterval(onVisible, POLL_MS); // skipped while the tab is hidden
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [enabled, refresh]);

  return <AlertCountContext.Provider value={enabled ? { count, refresh } : null}>{children}</AlertCountContext.Provider>;
}

export const useAlertCount = () => useContext(AlertCountContext);
