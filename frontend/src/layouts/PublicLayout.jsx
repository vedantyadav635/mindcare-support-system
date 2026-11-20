/**
 * Shell for public pages (landing, login, register, help): top nav, page, footer.
 * On the landing page the header floats over the hero's colour so the page starts with one full-width
 * background; on other pages it is a normal bar.
 */
import { Phone } from "lucide-react";
import { Link, Outlet, useLocation } from "react-router-dom";
import Logo from "../components/Logo";
import { Button, cx, SectionBlob } from "../components/ui";
import { APP_NAME, ROLE_HOME } from "../config";
import { useAuth } from "../context/AuthContext";

const FOOTER_COLUMNS = [
  { title: "Explore", links: [["/", "Home"], ["/register", "Create an account"], ["/login", "Log in"]] },
  { title: "For students", links: [["/register", "Daily check-ins"], ["/register", "Talk it out"], ["/register", "Self-checks"], ["/register", "Book a counsellor"]] },
  { title: "Support", links: [["/help", "Get help now"], ["/help", "Helplines"], ["/login", "Counsellor log in"]] },
];

const link = "text-ink-700 underline-offset-4 hover:text-ink-900 hover:underline";
const callLink = "font-bold text-ink-900 underline decoration-brand-500 decoration-2 underline-offset-4";

export default function PublicLayout() {
  const { user } = useAuth();
  const onLanding = useLocation().pathname === "/";

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-surface focus:px-4 focus:py-2">
        Skip to content
      </a>

      <header className={cx("z-30 w-full", onLanding && "absolute inset-x-0 top-0")}>
        <div className="mx-auto flex w-full max-w-wide items-center justify-between gap-4 px-4 py-4 md:px-8 lg:px-12">
          <Logo />
          <nav aria-label="Account" className="flex items-center gap-1 sm:gap-2">
            {user ? (
              <Button as={Link} to={ROLE_HOME[user.role]} size="sm" className="whitespace-nowrap">Open the app</Button>
            ) : (
              <>
                <Button as={Link} to="/help" variant="ghost" size="sm" className="whitespace-nowrap max-sm:hidden">Get help</Button>
                <Button as={Link} to="/login" variant="ghost" size="sm" className="whitespace-nowrap !px-3 sm:!px-4">Log in</Button>
                <Button as={Link} to="/register" size="sm" className="whitespace-nowrap">Get started</Button>
              </>
            )}
          </nav>
        </div>
      </header>

      <main id="main" className="flex-1">
        <Outlet />
      </main>

      {/* The rounded top overlaps the section above it (the same layered look as the landing sections) */}
      <footer className="relative -mt-8 overflow-hidden rounded-t-xl bg-sand">
        <SectionBlob shape="ring" color="lilac" aria-hidden="true" className="absolute -bottom-12 -right-12 size-48 opacity-40" />
        <div className="relative mx-auto grid max-w-wide gap-10 px-4 pb-10 pt-16 sm:grid-cols-2 md:px-8 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:px-12">
          <div>
            <Logo />
            <p className="mt-4 max-w-xs text-ink-700">A calmer way to look after your mind, one day at a time.</p>
            <p className="mt-6 text-ink-700">
              In crisis? Call Tele-MANAS{" "}
              <a href="tel:14416" className={cx("inline-flex items-center gap-1", callLink)}>
                <Phone aria-hidden="true" className="size-4" /> 14416
              </a>
              . In an emergency call <a href="tel:112" className={callLink}>112</a>.
            </p>
          </div>
          {FOOTER_COLUMNS.map((column) => (
            <nav key={column.title} aria-label={column.title}>
              <h2 className="mb-4 font-heading text-body font-extrabold">{column.title}</h2>
              <ul className="space-y-2.5">
                {column.links.map(([to, label]) => (
                  <li key={label}><Link to={to} className={link}>{label}</Link></li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="relative border-t border-line px-4 py-5 text-center text-small text-ink-700">
          {APP_NAME} is a support tool. It does not diagnose.
        </p>
      </footer>
    </div>
  );
}
