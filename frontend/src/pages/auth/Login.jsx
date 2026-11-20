import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import AuthSplit from "../../components/AuthSplit";
import ErrorNotice from "../../components/ErrorNotice";
import { Button, Card, FormField, Input, PasswordInput } from "../../components/ui";
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
      navigate(destination(user.role, location.state?.from), { replace: true }); // each role goes to its own home
    } catch (e) {
      // e.g. "Incorrect email or password", or "Too many failed login attempts..."
      setError(e.message);
      setBusy(false);
    }
  }

  return (
    <AuthSplit panel={{ tint: "lilac", title: "Good to see you again", text: "Take a breath. Your space is just how you left it." }}>
      <Card padding="lg">
        <h1>Welcome back</h1>
        <p className="mb-6 mt-2 text-ink-700">Log in to continue.</p>
        <form onSubmit={submit} className="space-y-5">
          <FormField label="Email">
            <Input type="email" autoComplete="email" required value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField label="Password">
            <PasswordInput autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} />
          </FormField>
          <ErrorNotice>{error}</ErrorNotice>
          <Button type="submit" loading={busy} className="w-full">Log in</Button>
        </form>
        <p className="mt-6 text-center text-ink-700">
          New here?{" "}
          <Link to="/register" className="font-bold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4">
            Create an account
          </Link>
        </p>
      </Card>
    </AuthSplit>
  );
}
