/** /admin/questions: the daily check-in questions, in the order students see them. Reorder, add, edit, hide. */
import { ArrowDown, ArrowUp, EyeOff, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import * as checkinApi from "../../api/checkin";
import QuestionFormModal from "../../components/admin/QuestionFormModal";
import { bodyFrom, reorderChanges } from "../../components/admin/questionForm";
import ConfirmModal from "../../components/ConfirmModal";
import ErrorNotice from "../../components/ErrorNotice";
import { Badge, Button, Card, EmptyState, PageHeader, Spinner, useToast } from "../../components/ui";
import useApi from "../../hooks/useApi";

const METRIC_LABEL = { mood: "Mood chart", stress: "Stress chart", sleep: "Sleep chart" };

export default function Questions() {
  const toast = useToast();
  const list = useApi(checkinApi.questions);
  const [editor, setEditor] = useState({ open: false, question: null });
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  // The API returns them in display order already; sort again so the screen never depends on that
  const questions = [...(list.data ?? [])].sort((a, b) => a.display_order - b.display_order || a.id - b.id);

  async function move(index, direction) {
    const changes = reorderChanges(questions, index, direction);
    if (changes.length === 0) return;
    setBusy(true);
    try {
      for (const { question, display_order } of changes) {
        await checkinApi.updateQuestion(question.id, bodyFrom(question, { display_order })); // one PUT per changed question
      }
    } catch (e) {
      toast(e.message, "error");
    }
    await list.reload();
    setBusy(false);
  }

  function askToHide(question) {
    setConfirm({
      title: "Hide this question?",
      text: `"${question.text}" will no longer be asked. Old answers keep their question. Hidden questions can't be brought back from this screen yet.`,
      confirmLabel: "Hide question",
      cancelLabel: "Keep it",
      onConfirm: async () => {
        setBusy(true);
        try {
          await checkinApi.deleteQuestion(question.id);
          toast("Question hidden");
          await list.reload();
        } catch (e) {
          toast(e.message, "error");
        }
        setBusy(false);
        setConfirm(null);
      },
    });
  }

  function saved(_, wasEditing) {
    setEditor({ open: false, question: null });
    toast(wasEditing ? "Question updated" : "Question added");
    list.reload();
  }

  return (
    <div>
      <PageHeader
        title="Check-in questions"
        subtitle="The questions students answer each day, in this order. Changes apply to the next check-in."
        action={<Button onClick={() => setEditor({ open: true, question: null })}><Plus aria-hidden="true" className="size-5" /> Add question</Button>}
      />

      {list.loading ? (
        <div className="flex justify-center py-16 text-brand-500"><Spinner size="lg" label="Loading questions" /></div>
      ) : list.error ? (
        <div className="max-w-md space-y-4">
          <ErrorNotice>{list.error}</ErrorNotice>
          <Button variant="secondary" onClick={list.reload}>Try again</Button>
        </div>
      ) : questions.length === 0 ? (
        <EmptyState
          title="No questions yet"
          text="Without questions the daily check-in is empty. Add the first one, or run the seed script."
          action={<Button onClick={() => setEditor({ open: true, question: null })}>Add a question</Button>}
        />
      ) : (
        <ol className="space-y-3">
          {questions.map((question, index) => (
            <li key={question.id}>
              <Card padding="md" className="flex flex-col gap-4 sm:flex-row sm:items-start">
                <span aria-hidden="true" className="flex size-10 shrink-0 items-center justify-center rounded-pill bg-brand-100 font-heading font-extrabold text-ink-900">{index + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-heading text-h3 font-bold text-ink-900">{question.text}</p>
                  <div className="mt-2 flex flex-wrap gap-2">
                    <Badge status="neutral">{question.answer_type === "option" ? "Options" : `Text, up to ${question.max_length}`}</Badge>
                    {METRIC_LABEL[question.metric] && <Badge status="info">{METRIC_LABEL[question.metric]}</Badge>}
                    <Badge status={question.is_required ? "brand" : "neutral"}>{question.is_required ? "Required" : "Optional"}</Badge>
                  </div>
                  {question.options && (
                    <p className="mt-2 text-small text-ink-700">{question.options.map((o) => `${o.label} (${o.value})`).join(" · ")}</p>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button variant="secondary" size="sm" onClick={() => move(index, -1)} disabled={busy || index === 0} aria-label={`Move question ${index + 1} up`}>
                    <ArrowUp aria-hidden="true" className="size-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => move(index, 1)} disabled={busy || index === questions.length - 1} aria-label={`Move question ${index + 1} down`}>
                    <ArrowDown aria-hidden="true" className="size-4" />
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => setEditor({ open: true, question })} aria-label={`Edit question ${index + 1}`}>
                    <Pencil aria-hidden="true" className="size-4" /> Edit
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => askToHide(question)} aria-label={`Hide question ${index + 1}`}>
                    <EyeOff aria-hidden="true" className="size-4" /> Hide
                  </Button>
                </div>
              </Card>
            </li>
          ))}
        </ol>
      )}

      <QuestionFormModal
        open={editor.open}
        question={editor.question}
        questions={questions}
        onClose={() => setEditor({ open: false, question: null })}
        onSaved={saved}
      />
      <ConfirmModal request={confirm} busy={busy} onClose={() => !busy && setConfirm(null)} />
    </div>
  );
}
