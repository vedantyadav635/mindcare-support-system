/**
 * One message. Student: orange bubble on the right. Assistant: white bubble on the left with the avatar.
 * Under an assistant reply: suggested resources as small tappable cards, or the crisis card.
 */
import { formatTime } from "../../utils/format";
import { typeInfo } from "../resources/resourceTypes";
import { cx } from "../ui";
import BotAvatar from "./BotAvatar";
import CrisisCard from "./CrisisCard";

export default function ChatBubble({ message, onOpenResource }) {
  const mine = message.sender === "student";

  return (
    <li className={cx("flex items-end gap-2", mine ? "justify-end" : "justify-start")}>
      {!mine && <BotAvatar />}
      <div className={cx("flex min-w-0 max-w-[85%] flex-col sm:max-w-[75%]", mine ? "items-end" : "items-start")}>
        {message.crisis ? (
          <CrisisCard response={message.crisis} />
        ) : (
          <p
            className={cx(
              "whitespace-pre-wrap break-words rounded-lg px-4 py-3 text-ink-900 shadow-soft",
              mine ? "rounded-br-sm bg-brand-500" : "rounded-bl-sm bg-surface",
            )}
          >
            <span className="sr-only">{mine ? "You: " : "Assistant: "}</span>
            {message.text}
          </p>
        )}
        <time dateTime={message.created_at} className="mt-1 px-1 text-small text-ink-700">{formatTime(message.created_at)}</time>

        {message.resources?.length > 0 && (
          <ul aria-label="Suggested for you" className="mt-2 flex w-full flex-col gap-2">
            {message.resources.map((resource) => {
              const { icon: Icon, label } = typeInfo(resource.type);
              return (
                <li key={resource.id}>
                  <button
                    type="button"
                    onClick={() => onOpenResource(resource)}
                    className="flex w-full items-center gap-3 rounded-md bg-surface px-3 py-2.5 text-left ring-2 ring-line transition hover:-translate-y-0.5 hover:ring-ink-500"
                  >
                    <span aria-hidden="true" className="flex size-9 shrink-0 items-center justify-center rounded-pill bg-brand-100">
                      <Icon className="size-4 text-ink-900" />
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-heading font-bold text-ink-900">{resource.title}</span>
                      <span className="block text-small text-ink-700">{label} · tap to open</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </li>
  );
}

/** "Assistant is typing" bubble with three bouncing dots. */
export function TypingIndicator() {
  return (
    <li className="flex items-end gap-2">
      <BotAvatar />
      <div role="status" className="flex gap-1.5 rounded-lg rounded-bl-sm bg-surface px-4 py-4 shadow-soft">
        <span className="sr-only">The assistant is typing</span>
        {[0, 150, 300].map((delay) => (
          <span key={delay} aria-hidden="true" className="size-2 animate-bounce rounded-pill bg-ink-500" style={{ animationDelay: `${delay}ms` }} />
        ))}
      </div>
    </li>
  );
}
