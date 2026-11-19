/** Student registration (counsellors are created by an admin). Logs in straight after. */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../../api/auth";
import { Button, Card, FormField, Input, Select } from "../../components/ui";
import { CircleAlert } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const EMPTY = { full_name: "", email: "", password: "", enrollment_no: "", department: "", year: "1", consent_given: false };

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      await authApi.register({ ...form, year: Number(form.year) });
      await login(form.email, form.password);
      navigate("/app", { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <section className="mx-auto max-w-2xl px-4 py-12">
      <Card padding="lg">
        <h1>Create your account</h1>
        <p className="mb-6 mt-2 text-ink-700">It takes a minute. We only ask for what we need.</p>
        <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
          <FormField label="Full name" className="sm:col-span-2">
            <Input autoComplete="name" required value={form.full_name} onChange={update("full_name")} />
          </FormField>
          <FormField label="College email">
            <Input type="email" autoComplete="email" required value={form.email} onChange={update("email")} />
          </FormField>
          <FormField label="Password" hint="8 to 72 characters">
            <Input type="password" autoComplete="new-password" minLength={8} maxLength={72} required value={form.password} onChange={update("password")} />
          </FormField>
          <FormField label="Enrollment number">
            <Input required value={form.enrollment_no} onChange={update("enrollment_no")} />
          </FormField>
          <FormField label="Department">
            <Input required value={form.department} onChange={update("department")} />
          </FormField>
          <FormField label="Year of study">
            <Select value={form.year} onChange={update("year")}>
              {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
          </FormField>

          <label className="flex cursor-pointer items-start gap-3 rounded-md bg-brand-50 p-4 sm:col-span-2">
            <input type="checkbox" required checked={form.consent_given} onChange={update("consent_given")} className="mt-1 size-5 shrink-0 accent-brand-500" />
            <span className="text-small text-ink-700">
              I agree that my check-ins and messages are stored to support me, and that a counsellor may contact me if my
              answers suggest I could be at risk. I understand this app <strong className="text-ink-900">does not diagnose</strong>.
            </span>
          </label>

          {error && (
            <p role="alert" className="flex items-center gap-2 rounded-md border-2 border-danger/40 bg-danger/10 px-4 py-3 text-small font-semibold text-ink-900 sm:col-span-2">
              <CircleAlert aria-hidden="true" className="size-4 shrink-0 text-danger" /> {error}
            </p>
          )}
          <Button type="submit" loading={busy} className="sm:col-span-2">Create account</Button>
        </form>
        <p className="mt-6 text-center text-ink-700">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4">Log in</Link>
        </p>
      </Card>
    </section>
  );
}
