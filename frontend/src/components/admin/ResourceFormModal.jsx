/**
 * Add / edit a wellness resource. resource = null -> add (POST), an existing one -> edit (PUT).
 * Tags are selectable chips from the allowed list. A resource needs a text OR a link (the backend checks this too).
 */
import { useState } from "react";
import * as resourcesApi from "../../api/resources";
import { tagLabel, typeInfo } from "../resources/resourceTypes";
import ErrorNotice from "../ErrorNotice";
import { Button, Chip, FormField, Input, Modal, Select, TextArea } from "../ui";

export default function ResourceFormModal({ open, resource, onClose, onSaved }) {
  return (
    <Modal open={open} onClose={onClose} title={resource ? "Edit resource" : "Add a resource"}>
      {open && <Form key={resource?.id ?? "new"} resource={resource} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}

function Form({ resource, onClose, onSaved }) {
  const editing = Boolean(resource);
  const [form, setForm] = useState({
    title: resource?.title ?? "",
    type: resource?.type ?? "activity",
    tags: resource?.tags ?? [],
    body: resource?.body ?? "",
    url: resource?.url ?? "",
  });
  const [contentError, setContentError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const set = (changes) => setForm((current) => ({ ...current, ...changes }));
  const toggleTag = (tag) => set({ tags: form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag] });

  async function submit(event) {
    event.preventDefault();
    setError("");
    if (!form.body.trim() && !form.url.trim()) {
      setContentError("Add some text, a link, or both.");
      return;
    }
    setContentError("");
    setBusy(true);
    const body = {
      title: form.title.trim(),
      type: form.type,
      tags: form.tags,
      body: form.body.trim() || null,
      url: form.url.trim() || null,
      is_active: true,
    };
    try {
      const saved = editing ? await resourcesApi.update(resource.id, body) : await resourcesApi.create(body);
      onSaved(saved, editing);
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} className="space-y-5">
      <ErrorNotice>{error}</ErrorNotice>
      <FormField label="Title"><Input required maxLength={200} value={form.title} onChange={(e) => set({ title: e.target.value })} /></FormField>
      <FormField label="Type">
        <Select value={form.type} onChange={(e) => set({ type: e.target.value })}>
          {resourcesApi.RESOURCE_TYPES.map((type) => <option key={type} value={type}>{typeInfo(type).filter}</option>)}
        </Select>
      </FormField>

      <fieldset>
        <legend className="mb-2 font-heading text-small font-bold text-ink-900">Helps with (tags)</legend>
        <ul className="flex flex-wrap gap-2">
          {resourcesApi.RESOURCE_TAGS.map((tag) => (
            <li key={tag}><Chip selected={form.tags.includes(tag)} onClick={() => toggleTag(tag)}>{tagLabel(tag)}</Chip></li>
          ))}
        </ul>
        <p className="mt-2 text-small text-ink-700">Tags decide when this is suggested to students. Use "Crisis" only for helplines.</p>
      </fieldset>

      <FormField label="Text" optional error={contentError || undefined} hint="Plain words, short paragraphs. Leave a blank line between paragraphs.">
        <TextArea maxLength={3000} value={form.body} onChange={(e) => set({ body: e.target.value })} />
      </FormField>
      <FormField label="Link" optional hint="A full address, starting with https://">
        <Input type="url" placeholder="https://" value={form.url} onChange={(e) => set({ url: e.target.value })} />
      </FormField>

      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" loading={busy}>{editing ? "Save changes" : "Add resource"}</Button>
      </div>
    </form>
  );
}
