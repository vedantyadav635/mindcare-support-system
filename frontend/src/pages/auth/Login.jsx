import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button, Card, FormField, Input, SectionBlob } from "../../components/ui";
import { ROLE_HOME } from "../../config";
import { useAuth } from "../../context/AuthContext";

/** Where to go after login: the page they first asked for (if it belongs to their role), else their home. */
function destination(role, from) {
  const home = ROLE_HOME[role];
  return from && from.startsWith(home) ? from : home;
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit(event) {
    event.preventDefault();
    setBusy(true);
    setError("");
    try {
      const user = await login(email, password);
      navigate(destination(user.role, location.state?.from), { replace: true });
    } catch (e) {
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <section className="relative mx-auto max-w-md px-4 py-12">
      <SectionBlob shape="circle" color="lilac" className="absolute -left-6 top-4 size-24 opacity-60" />
      <Card padding="lg" className="relative">
        <h1>Welcome back</h1>
        <p className="mb-6 mt-2 text-ink-700">Good to see you again.</p>
        <form onSubmit={submit} className="space-y-5">
          <FormField label="Email">
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField label="Password" error={error || undefined}>
            <Input type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormField>
          <Button type="submit" loading={busy} className="w-full">Log in</Button>
        </form>
        <p className="mt-6 text-center text-ink-700">
          New here?{" "}
          <Link to="/register" className="font-bold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4">
            Create an account
          </Link>
        </p>
      </Card>
    </section>
  );
}
