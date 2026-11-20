/**
 * "Add counsellor": creates the account with POST /admin/counsellors. The backend makes a temporary password
 * and returns it ONCE, so it is shown here (with a Copy button) and then gone when the dialog closes.
 * Never stored, never logged.
 */
import { Check, Copy } from "lucide-react";
import { useState } from "react";
import * as adminApi from "../../api/admin";
import ErrorNotice from "../ErrorNotice";
import { Button, FormField, Input, Modal, useToast } from "../ui";

const EMPTY = { full_name: "", email: "", qualification: "", specialization: "", phone: "" };

export default function AddCounsellorModal({ open, onClose, onCreated }) {
  return (
    <Modal open={open} onClose={onClose} title="Add a counsellor">
      {/* mounted only while open, so the form and any password are wiped when it closes */}
      {open && <Form onClose={onClose} onCreated={onCreated} />}
    </Modal>
  );
}

function Form({ onClose, onCreated }) {
  const toast = useToast();
  const [form, setForm] = useState(EMPTY);
  const [emailError, setEmailError] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [created, setCreated] = useState(null); // { user, temporary_password }
  const [copied, setCopied] = useState(false);
  const update = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setEmailError("");
    try {
      setCreated(await adminApi.createCounsellor(form));
      onCreated(); // refresh the list behind the dialog
    } catch (e) {
      if (e.status === 409) setEmailError("This email is already registered.");
      else setError(e.message);
    }
    setBusy(false);
  }

  async function copy() {
    try {
      await navigator.clipboard.writeText(created.temporary_password);
      setCopied(true);
    } catch {
      toast("Couldn't copy. Select the password and copy it by hand.", "error");
    }
  }

  if (created) {
    return (
      <div>
        <p className="text-ink-900">
          Account created for <strong>{created.user.full_name}</strong> ({created.user.email}).
        </p>
        <p className="mt-4 font-heading text-small font-bold text-ink-900">Temporary password</p>
        <div className="mt-1 flex items-center gap-2">
          <code className="min-w-0 flex-1 select-all break-all rounded-md bg-sand px-4 py-3 font-heading text-body font-extrabold text-ink-900">
            {created.temporary_password}
          </code>
          <Button variant="secondary" onClick={copy} aria-label="Copy the password">
            {copied ? <Check aria-hidden="true" className="size-5" /> : <Copy aria-hidden="true" className="size-5" />}
            {copied ? "Copied" : "Copy"}
          </Button>
        </div>
        <p role="note" className="mt-4 rounded-md bg-brand-50 px-4 py-3 text-small text-ink-900">
          This password is shown <strong>only once</strong>. Share it with the counsellor in a private message. It cannot be shown again.
        </p>
        <div className="mt-6 flex justify-end"><Button onClick={onClose}>Done</Button></div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4">
      <FormField label="Full name"><Input required maxLength={150} value={form.full_name} onChange={update("full_name")} /></FormField>
      <FormField label="Email" error={emailError || undefined}><Input type="email" required value={form.email} onChange={update("email")} /></FormField>
      <FormField label="Qualification"><Input required maxLength={150} value={form.qualification} onChange={update("qualification")} /></FormField>
      <FormField label="Specialization"><Input required maxLength={150} value={form.specialization} onChange={update("specialization")} /></FormField>
      <FormField label="Phone"><Input type="tel" required minLength={5} maxLength={20} value={form.phone} onChange={update("phone")} /></FormField>
      <ErrorNotice>{error}</ErrorNotice>
      <div className="flex justify-end gap-3 pt-2">
        <Button variant="secondary" onClick={onClose} disabled={busy}>Cancel</Button>
        <Button type="submit" loading={busy}>Create account</Button>
      </div>
    </form>
  );
}
