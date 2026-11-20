/** Student registration (counsellors are created by an admin). Logs the new student straight in. */
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import * as authApi from "../../api/auth";
import AuthSplit from "../../components/AuthSplit";
import ErrorNotice from "../../components/ErrorNotice";
import PasswordStrength from "../../components/PasswordStrength";
import { Button, Card, FormField, Input, PasswordInput, Select } from "../../components/ui";
import { ROLE_HOME } from "../../config";
import { useAuth } from "../../context/AuthContext";

const EMPTY = { full_name: "", email: "", password: "", enrollment_no: "", department: "", year: "1", consent_given: false };

export default function Register() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [emailError, setEmailError] = useState(""); // shown right under the email box
  const [error, setError] = useState(""); // any other backend error
  const [busy, setBusy] = useState(false);

  const update = (key) => (e) => setForm({ ...form, [key]: e.target.type === "checkbox" ? e.target.checked : e.target.value });

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    setEmailError("");
    try {
      await authApi.register({ ...form, year: Number(form.year) });
    } catch (e) {
      // 409 = this email already has an account: show it next to the email field
      if (e.status === 409) setEmailError("This email is already registered. Try logging in instead.");
      else setError(e.message);
      setBusy(false);
      return;
    }
    try {
      const user = await login(form.email, form.password);
      navigate(ROLE_HOME[user.role], { replace: true });
    } catch {
      // The account exists now, so just send them to log in
      navigate("/login", { replace: true });
    }
  }

  return (
    <AuthSplit panel={{ tint: "sun", title: "Let's get you started", text: "A few details, and you're in. It only takes a minute." }}>
      <Card padding="lg">
        <h1>Create your account</h1>
        <p className="mb-6 mt-2 text-ink-700">We only ask for what we need.</p>
        <form onSubmit={submit} className="grid gap-5 sm:grid-cols-2">
          <FormField label="Full name" className="sm:col-span-2">
            <Input autoComplete="name" required maxLength={150} value={form.full_name} onChange={update("full_name")} />
          </FormField>
          <FormField label="College email" error={emailError || undefined} className="sm:col-span-2">
            <Input type="email" autoComplete="email" required value={form.email} onChange={update("email")} />
          </FormField>
          <FormField label="Password" hint={<PasswordStrength password={form.password} />} className="sm:col-span-2">
            <PasswordInput autoComplete="new-password" minLength={8} maxLength={72} required value={form.password} onChange={update("password")} />
          </FormField>
          <FormField label="Enrollment number">
            <Input required maxLength={50} value={form.enrollment_no} onChange={update("enrollment_no")} />
          </FormField>
          <FormField label="Department">
            <Input required maxLength={100} value={form.department} onChange={update("department")} />
          </FormField>
          <FormField label="Year of study" className="sm:col-span-2">
            <Select value={form.year} onChange={update("year")}>
              {[1, 2, 3, 4, 5, 6].map((y) => <option key={y} value={y}>Year {y}</option>)}
            </Select>
          </FormField>

          {/* Consent: plain-language explanation, required before the account is created */}
          <div className="rounded-md bg-brand-50 p-4 sm:col-span-2">
            <label className="flex cursor-pointer items-start gap-3">
              <input type="checkbox" required checked={form.consent_given} onChange={update("consent_given")} className="mt-1 size-5 shrink-0 accent-brand-500" />
              <span className="font-semibold text-ink-900">I understand and agree</span>
            </label>
            <ul className="mt-3 list-disc space-y-1.5 pl-9 text-small text-ink-700">
              <li>My check-ins and chat messages are saved so the app can support me.</li>
              <li>If my answers suggest I may be at risk, a counsellor may reach out to me.</li>
              <li>This app is a support tool and <strong className="text-ink-900">does not diagnose</strong>.</li>
              <li>I can delete my account and all my data at any time.</li>
            </ul>
          </div>

          <div className="sm:col-span-2"><ErrorNotice>{error}</ErrorNotice></div>
          <Button type="submit" loading={busy} className="sm:col-span-2">Create account</Button>
        </form>
        <p className="mt-6 text-center text-ink-700">
          Already have an account?{" "}
          <Link to="/login" className="font-bold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4">Log in</Link>
        </p>
      </Card>
    </AuthSplit>
  );
}
