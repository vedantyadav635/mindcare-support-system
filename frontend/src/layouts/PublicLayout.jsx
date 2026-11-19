/** Shell for public pages (landing, login, register): top nav, page, footer. */
import { Phone } from "lucide-react";
import { Link, Outlet } from "react-router-dom";
import Logo from "../components/Logo";
import { Button } from "../components/ui";
import { APP_NAME, ROLE_HOME } from "../config";
import { useAuth } from "../context/AuthContext";

const FOOTER_COLUMNS = [
  { title: APP_NAME, links: [["/", "Home"], ["/register", "Create an account"], ["/login", "Log in"]] },
  { title: "For students", links: [["/register", "Daily check-ins"], ["/register", "Talk it out"], ["/register", "Book a counsellor"]] },
];

export default function PublicLayout() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-surface focus:px-4 focus:py-2">
        Skip to content
      </a>

      <header className="mx-auto flex w-full max-w-content items-center justify-between gap-4 px-4 py-4 md:px-6">
        <Logo />
        <nav aria-label="Account" className="flex items-center gap-2">
          {user ? (
            <Button as={Link} to={ROLE_HOME[user.role]} size="sm">Open the app</Button>
          ) : (
            <>
              <Button as={Link} to="/login" variant="ghost" size="sm">Log in</Button>
              <Button as={Link} to="/register" size="sm">Get started</Button>
            </>
          )}
        </nav>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-16 bg-sand">
        <div className="mx-auto grid max-w-content gap-8 px-4 py-12 sm:grid-cols-3 md:px-6">
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-3 font-heading text-body font-extrabold">{column.title}</h2>
              <ul className="space-y-2">
                {column.links.map(([to, label]) => (
                  <li key={label}>
                    <Link to={to} className="text-ink-700 underline-offset-4 hover:text-ink-900 hover:underline">{label}</Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
          <div>
            <h2 className="mb-3 font-heading text-body font-extrabold">Need help now?</h2>
            <p className="text-ink-700">
              In crisis? Call Tele-MANAS{" "}
              <a href="tel:14416" className="inline-flex items-center gap-1 font-bold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4">
                <Phone aria-hidden="true" className="size-4" /> 14416
              </a>
              . In an emergency call <a href="tel:112" className="font-bold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4">112</a>.
            </p>
          </div>
        </div>
        <p className="border-t border-line px-4 py-4 text-center text-small text-ink-700">
          {APP_NAME} is a support tool. It does not diagnose.
        </p>
      </footer>
    </div>
  );
}
