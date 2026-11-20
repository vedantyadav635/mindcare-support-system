/** StatusBadge: an appointment status (requested / confirmed / completed / cancelled) as a Badge. */
import { Badge } from "./ui";

const STATUS = {
  requested: ["warning", "Requested"],
  confirmed: ["success", "Confirmed"],
  completed: ["info", "Completed"],
  cancelled: ["neutral", "Cancelled"],
};

export default function StatusBadge({ status }) {
  const [kind, label] = STATUS[status] ?? ["neutral", status];
  return <Badge status={kind}>{label}</Badge>;
}
