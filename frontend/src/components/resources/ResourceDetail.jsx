/**
 * ResourceDetail: a resource opened in a dialog.
 *   - breathing resources get the guided breathing circle
 *   - the text is split into paragraphs (blank line = new paragraph)
 *   - a link button if the resource has a url; tap-to-call buttons for crisis resources
 * Pass resource={null} to close it.
 */
import { ExternalLink, Phone } from "lucide-react";
import { phoneNumbers } from "../../utils/format";
import { Button, Chip, Modal } from "../ui";
import BreathingCircle, { patternFor } from "./BreathingCircle";
import { tagLabel, typeInfo } from "./resourceTypes";

export default function ResourceDetail({ resource, onClose }) {
  return (
    <Modal
      open={Boolean(resource)}
      onClose={onClose}
      title={resource?.title}
      footer={
        resource && (
          <>
            {resource.url && (
              <Button as="a" href={resource.url} target="_blank" rel="noreferrer">
                Open link <ExternalLink aria-hidden="true" className="size-4" />
                <span className="sr-only"> (opens in a new tab)</span>
              </Button>
            )}
            <Button variant="secondary" onClick={onClose}>Close</Button>
          </>
        )
      }
    >
      {/* Mounted only while open, so the breathing timer never runs in the background */}
      {resource && <Content resource={resource} />}
    </Modal>
  );
}

function Content({ resource }) {
  const { icon, label } = typeInfo(resource.type);
  const paragraphs = (resource.body ?? "").split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
  const tags = resource.tags.filter((tag) => tag !== "crisis");
  const calls = resource.tags.includes("crisis") ? phoneNumbers(resource.body ?? "") : [];

  return (
    <div>
      <Chip icon={icon} className="mb-5">{label}</Chip>

      {resource.type === "breathing" && <BreathingCircle phases={patternFor(resource.title)} />}

      <div className="space-y-4">
        {paragraphs.map((paragraph) => (
          <p key={paragraph} className="whitespace-pre-line text-body text-ink-700">{paragraph}</p>
        ))}
      </div>

      {calls.length > 0 && (
        <div className="mt-5 flex flex-wrap gap-2">
          {calls.map((number) => (
            <Button key={number} as="a" href={`tel:${number.replaceAll("-", "")}`} size="sm">
              <Phone aria-hidden="true" className="size-4" /> {number}
            </Button>
          ))}
        </div>
      )}

      {tags.length > 0 && (
        <div className="mt-6">
          <p className="mb-2 text-small font-semibold text-ink-900">Can help with</p>
          <ul className="flex flex-wrap gap-2">
            {tags.map((tag) => <li key={tag}><Chip>{tagLabel(tag)}</Chip></li>)}
          </ul>
        </div>
      )}
    </div>
  );
}
