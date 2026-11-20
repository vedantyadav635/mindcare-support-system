/** The support assistant's small round avatar: an original smiling circle (decorative). */
import { SectionBlob } from "../ui";

export default function BotAvatar() {
  return (
    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-surface shadow-soft">
      <SectionBlob shape="smile" color="mint" className="size-7" />
    </span>
  );
}
