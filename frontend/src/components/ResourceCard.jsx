/**
 * ResourceCard: one wellness resource, optionally with the "why" line from the recommender.
 *   onOpen: when given, the card shows a button that opens the resource's detail ("Try it" for breathing, else "Read more")
 */
import { ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { typeInfo } from "./resources/resourceTypes";
import { Button, Card } from "./ui";

export default function ResourceCard({ resource, why, onOpen }) {
  const { icon: Icon, tint, label } = typeInfo(resource.type);
  return (
    <Card tint={tint} hover className="flex h-full flex-col">
      <div className="mb-4 flex items-center gap-3">
        <span aria-hidden="true" className="flex size-11 items-center justify-center rounded-pill bg-surface shadow-soft">
          <Icon className="size-5 text-ink-900" />
        </span>
        <span className="font-heading text-small font-bold text-ink-900">{label}</span>
      </div>
      <h3>{resource.title}</h3>
      {resource.body && <p className="mt-2 line-clamp-4 flex-1 text-ink-700">{resource.body}</p>}
      {why && <p className="mt-4 text-small font-semibold text-ink-900">{why}</p>}
      <div className="mt-4 flex flex-wrap gap-2">
        {onOpen && (
          <Button size="sm" onClick={() => onOpen(resource)} aria-label={`${resource.type === "breathing" ? "Try" : "Read more about"}: ${resource.title}`}>
            {resource.type === "breathing" ? "Try it" : "Read more"}
          </Button>
        )}
        {resource.type === "counselling" && (
          <Button as={Link} to="/app/appointments" size="sm" variant={onOpen ? "secondary" : "primary"}>Book a session</Button>
        )}
        {resource.url && (
          <Button as="a" href={resource.url} target="_blank" rel="noreferrer" variant="secondary" size="sm">
            Open <ExternalLink aria-hidden="true" className="size-4" />
            <span className="sr-only"> (opens in a new tab)</span>
          </Button>
        )}
      </div>
    </Card>
  );
}
