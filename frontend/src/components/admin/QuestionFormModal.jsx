/**
 * Add / edit a check-in question, with a live preview of how it will look in the check-in.
 *   question = null  -> add (POST)       question = an existing one -> edit (PUT)
 * Instant checks come from questionForm.js; whatever the backend rejects (for example "another active question
 * already uses metric mood") is shown at the top of the form, exactly as the server says it.
 */
import { Plus, Trash2 } from "lucide-react";
import { useState } from "react";
import * as checkinApi from "../../api/checkin";
import QuestionStep from "../checkin/QuestionStep";
import ErrorNotice from "../ErrorNotice";
import { Button, Card, FormField, Input, Modal, Select, Switch, TextArea } from "../ui";
import { emptyForm, fromQuestion, METRIC_HINT, nextOrder, previewQuestion, toBody, validate } from "./questionForm";

export default function QuestionFormModal({ open, question, questions, onClose, onSaved }) {
  const editing = Boolean(question);
  return (
    <Modal open={open} onClose={onClose} title={editing ? "Edit question" : "Add a question"} size="lg">
      {/* Mounted only while open (and keyed per question) so the form always starts fresh */}
      {open && <Form key={question?.id ?? "new"} question={question} questions={questions} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function Form({ question, questions, onClose, onSaved }) {
  const editing = Boolean(question);
  const [form, setForm] = useState(() => (editing ? fromQuestion(question) : emptyForm(nextOrder(questions))));
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [busy, setBusy] = useState(false);
  const [previewValue, setPreviewValue] = useState(undefined);

  const isOption = form.answer_type === "option";
  const set = (changes) => setForm((current) => ({ ...current, ...changes }));

  // Options editor
  const setOption = (index, changes) => set({ options: form.options.map((o, i) => (i === index ? { ...o, ...changes } : o)) });
  const addOption = () => set({ options: [...form.options, { label: "", value: "" }] });
  const removeOption = (index) => set({ options: form.options.filter((_, i) => i !== index) });

  function changeType(answerType) {
    // A text question can't have a metric; an option question needs at least 2 option rows
    set({ answer_type: answerType, metric: answerType === "text" ? "none" : form.metric });
    setPreviewValue(undefined);
  }

  async function submit(event) {
    event.preventDefault();
    setServerError("");
    const found = validate(form);
    setErrors(found);
    if (Object.keys(found).length > 0) return;

    setBusy(true);
    try {
      const body = toBody(form, { isActive: question?.is_active ?? true });
      const saved = editing ? await checkinApi.updateQuestion(question.id, body) : await checkinApi.createQuestion(body);
      onSaved(saved, editing);
    } catch (e) {
      setServerError(e.message); // the backend's own wording
      setBusy(false);
    }
  }

  return (
    <div className="grid gap-8 md:grid-cols-[1fr_20rem]">
      <form onSubmit={submit} noValidate className="space-y-5">
        <ErrorNotice>{serverError}</ErrorNotice>

        <FormField label="Question" error={errors.text}>
          <TextArea maxLength={300} value={form.text} onChange={(e) => set({ text: e.target.value })} className="min-h-24" />
        </FormField>

        <FormField label="Answer type">
          <Select value={form.answer_type} onChange={(e) => changeType(e.target.value)}>
            <option value="option">Choose one option</option>
            <option value="text">Short written answer</option>
          </Select>
        </FormField>

        {isOption ? (
          <>
            <fieldset>
              <legend className="mb-2 font-heading text-small font-bold text-ink-900">Options</legend>
              <ul className="space-y-2">
                {form.options.map((option, index) => (
                  <li key={index} className="flex items-center gap-2">
                    <Input aria-label={`Option ${index + 1} label`} placeholder="Label, e.g. Good" value={option.label} onChange={(e) => setOption(index, { label: e.target.value })} />
                    <Input aria-label={`Option ${index + 1} value`} placeholder="Value" inputMode="decimal" className="max-w-28" value={option.value} onChange={(e) => setOption(index, { value: e.target.value })} />
                    <Button variant="ghost" size="sm" onClick={() => removeOption(index)} disabled={form.options.length <= 2} aria-label={`Remove option ${index + 1}`}>
                      <Trash2 aria-hidden="true" className="size-4" />
                    </Button>
                  </li>
                ))}
              </ul>
              {errors.options && <p role="alert" className="mt-2 text-small font-semibold text-ink-900">⚠ {errors.options}</p>}
              <Button variant="secondary" size="sm" onClick={addOption} className="mt-3"><Plus aria-hidden="true" className="size-4" /> Add option</Button>
            </fieldset>

            <FormField label="Fills a chart" hint={METRIC_HINT}>
              <Select value={form.metric} onChange={(e) => set({ metric: e.target.value })}>
                <option value="none">Nothing (just a question)</option>
                <option value="mood">Mood chart</option>
                <option value="stress">Stress chart</option>
                <option value="sleep">Sleep chart</option>
              </Select>
            </FormField>
          </>
        ) : (
          <FormField label="Longest answer (characters)" error={errors.maxLength}>
            <Input type="number" min={1} max={2000} value={form.max_length} onChange={(e) => set({ max_length: e.target.value })} />
          </FormField>
        )}

        <div className="flex items-center justify-between gap-4 rounded-md bg-sand px-4 py-3">
          <div>
            <p className="font-heading font-bold text-ink-900">Required</p>
            <p className="text-small text-ink-700">Students must answer before they can finish.</p>
          </div>
          <Switch label="Required" checked={form.is_required} onChange={(value) => set({ is_required: value })} />
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
          <Button type="submit" loading={busy}>{editing ? "Save changes" : "Add question"}</Button>
        </div>
      </form>

      {/* Live preview: the same screen students see in the check-in */}
      <aside aria-label="Preview" className="md:sticky md:top-0 md:self-start">
        <p className="mb-2 font-heading text-small font-bold text-ink-700">Preview (how students see it)</p>
        <Card tint="brand" padding="md">
          <QuestionStep question={previewQuestion(form)} value={previewValue} onChange={setPreviewValue} onPick={setPreviewValue} onEnter={() => {}} />
        </Card>
      </aside>
    </div>
  );
}
