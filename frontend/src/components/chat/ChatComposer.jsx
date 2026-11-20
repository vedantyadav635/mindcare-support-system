/**
 * The message box. Enter sends, Shift+Enter adds a new line, 1000 characters at most.
 *   onSend(text) -> Promise<boolean>; on false (not sent) the text is put back so nothing is lost.
 * The text lives only in this component's state.
 */
import { Send } from "lucide-react";
import { useState } from "react";
import { Button, cx } from "../ui";
import { FIELD_BASE } from "../ui/fieldStyles";

export const MAX_LENGTH = 1000;

export default function ChatComposer({ onSend, disabled }) {
  const [text, setText] = useState("");
  const canSend = text.trim().length > 0 && !disabled;

  async function submit() {
    if (!canSend) return;
    const message = text.trim();
    setText("");
    const sent = await onSend(message);
    if (!sent) setText((current) => current || message); // give it back unless they already typed something new
  }

  function onKeyDown(event) {
    // Enter sends; Shift+Enter is a new line; ignore Enter while an IME is composing (e.g. Hindi keyboards)
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); submit(); }} className="border-t border-line bg-cream pt-3">
      <label htmlFor="chat-message" className="sr-only">Your message</label>
      <div className="flex items-end gap-2">
        <textarea
          id="chat-message"
          rows={1}
          maxLength={MAX_LENGTH}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="Type how you feel…"
          aria-describedby="chat-hint chat-count"
          className={cx(FIELD_BASE, "field-sizing-content max-h-40 min-h-12 resize-none rounded-lg py-3")}
        />
        <Button type="submit" disabled={!canSend} aria-label="Send message" className="!px-4">
          <Send aria-hidden="true" className="size-5" />
        </Button>
      </div>
      <div className="mt-1.5 flex justify-between gap-3 px-1 text-small text-ink-700">
        <span id="chat-hint" className="hidden sm:inline">Enter to send · Shift+Enter for a new line</span>
        <span id="chat-count" aria-live="polite" className={cx("ml-auto", text.length > MAX_LENGTH * 0.9 && "font-bold text-ink-900")}>
          {text.length} / {MAX_LENGTH}
        </span>
      </div>
    </form>
  );
}
