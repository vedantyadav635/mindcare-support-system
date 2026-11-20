/**
 * /app/chat: the support chat.
 *   - disclaimer pinned at the top, then (after a crisis reply) a banner to the help page
 *   - messages: history from GET /chat/history (20 at a time, "Load earlier"), new ones from POST /chat/message
 *   - crisis replies show a highlighted card with call buttons instead of a normal bubble
 * Privacy: messages are kept only in memory, never in localStorage / sessionStorage, and never logged.
 */
import { LifeBuoy } from "lucide-react";
import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import * as chatApi from "../../api/chat";
import BotAvatar from "../../components/chat/BotAvatar";
import ChatBubble, { TypingIndicator } from "../../components/chat/ChatBubble";
import ChatComposer from "../../components/chat/ChatComposer";
import { dayLabel, hasOlder, oldestFirst, prependEarlier } from "../../components/chat/chatMessages";
import ErrorNotice from "../../components/ErrorNotice";
import ResourceDetail from "../../components/resources/ResourceDetail";
import { Button, Disclaimer, Spinner } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import { telHref } from "../../utils/format";

const PAGE_SIZE = 20;
let localId = 0; // ids for messages created in this tab (the API reply doesn't include ids)
const newLocalId = () => `local-${++localId}`;

export default function Chat() {
  const { user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [page, setPage] = useState(1);
  const [moreAvailable, setMoreAvailable] = useState(false);
  const [loadingEarlier, setLoadingEarlier] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [sendError, setSendError] = useState("");
  const [latestCrisis, setLatestCrisis] = useState(null); // shows the help banner once a crisis reply arrives
  const [openResource, setOpenResource] = useState(null);

  const scroller = useRef(null);
  const keepScrollFrom = useRef(null); // scrollHeight before "Load earlier", to keep the view steady

  // ---------- Loading history ----------

  const loadFirstPage = useCallback(() => {
    return chatApi
      .history({ page: 1, pageSize: PAGE_SIZE })
      .then((result) => {
        setMessages(oldestFirst(result.items));
        setMoreAvailable(hasOlder(result));
        setLoadError("");
      })
      .catch((e) => setLoadError(e.message))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    loadFirstPage();
  }, [loadFirstPage]);

  async function loadEarlier() {
    setLoadingEarlier(true);
    try {
      const result = await chatApi.history({ page: page + 1, pageSize: PAGE_SIZE });
      keepScrollFrom.current = scroller.current?.scrollHeight ?? null;
      setMessages((current) => prependEarlier(current, oldestFirst(result.items)));
      setPage(page + 1);
      setMoreAvailable(hasOlder(result));
    } catch (e) {
      setSendError(e.message);
    }
    setLoadingEarlier(false);
  }

  // Scroll: stay at the bottom for new messages; after "Load earlier" keep the same message in view
  useLayoutEffect(() => {
    const el = scroller.current;
    if (!el) return;
    if (keepScrollFrom.current !== null) {
      el.scrollTop = el.scrollHeight - keepScrollFrom.current;
      keepScrollFrom.current = null;
    } else {
      el.scrollTop = el.scrollHeight;
    }
  }, [messages, waiting]);

  // ---------- Sending ----------

  async function send(text) {
    setSendError("");
    const mine = { id: newLocalId(), sender: "student", text, created_at: new Date().toISOString() };
    setMessages((current) => [...current, mine]);
    setWaiting(true);
    try {
      const reply = await chatApi.send(text);
      const crisis = reply.crisis ? reply.crisis_response : null;
      setMessages((current) => [
        ...current,
        { id: newLocalId(), sender: "bot", text: reply.reply, created_at: new Date().toISOString(), resources: reply.suggested_resources, crisis },
      ]);
      if (crisis) setLatestCrisis(crisis);
      return true;
    } catch (e) {
      setMessages((current) => current.filter((m) => m.id !== mine.id)); // not sent: take it back out
      setSendError(`Your message wasn't sent. ${e.message}`);
      return false;
    } finally {
      setWaiting(false);
    }
  }

  // ---------- Screen ----------

  return (
    <div className="mx-auto flex h-[calc(100dvh-13rem)] min-h-[28rem] max-w-3xl flex-col lg:h-[calc(100dvh-9rem)]">
      <h1 className="sr-only">Support chat</h1>

      {/* Pinned: always visible above the conversation */}
      <Disclaimer className="mb-3">
        I'm an automated support assistant, not a therapist. For urgent help call{" "}
        <a href={telHref("14416")} className="font-bold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-2">14416</a>.
      </Disclaimer>

      {latestCrisis && (
        <Link
          to="/app/help"
          state={{ crisisResponse: latestCrisis }}
          className="mb-3 flex items-center gap-3 rounded-md border-2 border-brand-300 bg-brand-50 px-4 py-3 font-semibold text-ink-900 transition hover:bg-brand-100"
        >
          <LifeBuoy aria-hidden="true" className="size-5 shrink-0" />
          <span className="flex-1">If you might be in danger, help is one tap away. Open the help page.</span>
          <span aria-hidden="true">→</span>
        </Link>
      )}

      {/* tabIndex=0: keyboard users can focus the conversation and scroll it with the arrow keys */}
      <div ref={scroller} role="log" tabIndex={0} aria-label="Conversation" className="flex-1 overflow-y-auto rounded-lg bg-sand/60 p-3 sm:p-5">
        {loading ? (
          <div className="flex h-full items-center justify-center text-brand-500"><Spinner size="lg" label="Loading your conversation" /></div>
        ) : loadError ? (
          <div className="mx-auto max-w-sm space-y-4 py-10 text-center">
            <ErrorNotice>{loadError}</ErrorNotice>
            <Button variant="secondary" onClick={() => { setLoading(true); loadFirstPage(); }}>Try again</Button>
          </div>
        ) : (
          <>
            {moreAvailable && (
              <div className="mb-4 text-center">
                <Button variant="secondary" size="sm" onClick={loadEarlier} loading={loadingEarlier}>Load earlier messages</Button>
              </div>
            )}
            <ol className="space-y-4">
              {messages.length === 0 && (
                // A friendly opener (shown only on screen, not saved)
                <li className="flex items-end gap-2">
                  <BotAvatar />
                  <p className="max-w-[85%] rounded-lg rounded-bl-sm bg-surface px-4 py-3 text-ink-900 shadow-soft">
                    Hi {user.full_name.split(" ")[0]}, I'm here to listen. How are you feeling today?
                  </p>
                </li>
              )}
              {messages.map((message, index) => {
                const label = dayLabel(message.created_at);
                const newDay = index === 0 || label !== dayLabel(messages[index - 1].created_at);
                return (
                  <Fragment key={message.id}>
                    {newDay && (
                      <li aria-hidden="true" className="py-1 text-center">
                        <span className="rounded-pill bg-surface px-3 py-1 text-small font-semibold text-ink-700">{label}</span>
                      </li>
                    )}
                    <ChatBubble message={message} onOpenResource={setOpenResource} />
                  </Fragment>
                );
              })}
              {waiting && <TypingIndicator />}
            </ol>
          </>
        )}
      </div>

      <div className="mt-2"><ErrorNotice>{sendError}</ErrorNotice></div>
      <ChatComposer onSend={send} disabled={waiting || loading || Boolean(loadError)} />

      <ResourceDetail resource={openResource} onClose={() => setOpenResource(null)} />
    </div>
  );
}
