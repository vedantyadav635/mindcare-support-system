/**
 * Shell for logged-in pages.
 *   Desktop (lg+): left sidebar with rounded icon + label links.
 *   Mobile: bottom tab bar (first 4 links + "More").
 *   Top bar: greeting, "Need help now?" pill, avatar menu (profile, log out).
 */
import { ChevronDown, LifeBuoy, LogOut, MoreHorizontal, UserRound } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { Link, NavLink, Outlet, useLocation } from "react-router-dom";
import Logo from "../components/Logo";
import { Avatar, Badge, Button, cx, Modal } from "../components/ui";
import { ROLE_HOME } from "../config";
import { AlertCountProvider, useAlertCount } from "../context/AlertCountContext";
import { useAuth } from "../context/AuthContext";
import { MOBILE_TABS, NAVIGATION } from "./navigation";

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const firstName = (name = "") => name.replace(/^(dr|mr|ms|mrs|prof)\.?\s+/i, "").split(" ")[0];

export default function AppLayout() {
  const { user } = useAuth();
  const location = useLocation();
  const links = NAVIGATION[user.role];

  return (
    <AlertCountProvider enabled={user.role === "counsellor"}>
    <div className="min-h-screen bg-gradient-to-br from-cream via-cream to-brand-50 lg:flex">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-50 focus:rounded-pill focus:bg-surface focus:px-4 focus:py-2">
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col border-r border-line bg-surface px-4 py-6 lg:flex">
        <div className="mb-8 px-2"><Logo to={ROLE_HOME[user.role]} /></div>
        <nav aria-label="Main" className="flex flex-col gap-1">
          {links.map((link) => <SidebarLink key={link.to} {...link} />)}
        </nav>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <TopBar />
        {/* pb-28 leaves room for the mobile tab bar; key = path replays the fade-in per page */}
        <main id="main" key={location.pathname} className="mx-auto w-full max-w-wide flex-1 animate-fade-up px-4 pb-28 pt-6 md:px-8 lg:px-10 lg:pb-12">
          <Outlet />
        </main>
      </div>

      <MobileTabBar links={links} />
    </div>
    </AlertCountProvider>
  );
}

/** Small count pill (e.g. open alerts). Screen readers hear "3 open", not just "3". */
function CountBadge({ count, className }) {
  if (!count) return null;
  return (
    <span className={cx("min-w-6 rounded-pill bg-brand-500 px-2 text-center text-small font-bold text-ink-900", className)}>
      <span aria-hidden="true">{count > 99 ? "99+" : count}</span>
      <span className="sr-only">{count} open</span>
    </span>
  );
}

function SidebarLink({ to, label, icon: Icon, end, badge }) {
  const alerts = useAlertCount();
  return (
    <NavLink
      to={to}
      end={end}
      className={({ isActive }) =>
        cx(
          "group flex items-center gap-3 rounded-pill px-2 py-2 font-heading font-bold transition",
          isActive ? "bg-brand-50 text-ink-900" : "text-ink-700 hover:bg-sand hover:text-ink-900",
        )
      }
    >
      {({ isActive }) => (
        <>
          <span className={cx("flex size-10 items-center justify-center rounded-pill transition", isActive ? "bg-brand-500 text-ink-900" : "bg-sand group-hover:bg-line")}>
            <Icon aria-hidden="true" className="size-5" />
          </span>
          <span className="flex-1">{label}</span>
          {badge === "alerts" && <CountBadge count={alerts?.count} className="mr-2" />}
        </>
      )}
    </NavLink>
  );
}

function TopBar() {
  const { user } = useAuth();
  return (
    <header className="sticky top-0 z-30 border-b border-line bg-cream/90 backdrop-blur">
      <div className="mx-auto flex max-w-wide items-center gap-3 px-4 py-3 md:px-8 lg:px-10">
        {/* Greeting (smaller on phones; the logo lives in the desktop sidebar) */}
        <p className="min-w-0 flex-1 truncate font-heading text-body font-extrabold text-ink-900 md:text-h3">
          {greeting()}, {firstName(user.full_name)}
        </p>
        <div className="flex shrink-0 items-center gap-2">
          <HelpPill />
          <AvatarMenu />
        </div>
      </div>
    </header>
  );
}

/** Always-visible way to the crisis screen. */
function HelpPill() {
  return (
    <Link
      to="/app/help"
      className="inline-flex min-h-10 items-center gap-1.5 rounded-pill bg-danger/10 px-3 text-small font-bold text-ink-900 ring-2 ring-danger/30 transition hover:bg-danger/15 sm:px-4"
    >
      <LifeBuoy aria-hidden="true" className="size-4 text-danger" />
      {/* Short label on very small phones */}
      <span className="sm:hidden">Help</span>
      <span className="hidden sm:inline">Need help now?</span>
    </Link>
  );
}

/** Avatar button that opens a small menu (profile, log out). Closes on Escape or outside click. */
function AvatarMenu() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const wrapper = useRef(null);

  useEffect(() => {
    if (!open) return;
    const onClick = (e) => !wrapper.current?.contains(e.target) && setOpen(false);
    const onKey = (e) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onClick);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onClick);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div ref={wrapper} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="account-menu"
        aria-label="Account menu"
        onClick={() => setOpen(!open)}
        className="flex items-center gap-1 rounded-pill p-1 transition hover:bg-sand"
      >
        <Avatar name={user.full_name} size="sm" />
        <ChevronDown aria-hidden="true" className={cx("size-4 text-ink-700 transition", open && "rotate-180")} />
      </button>

      {open && (
        <div id="account-menu" className="absolute right-0 top-full mt-2 w-56 animate-pop-in rounded-md bg-surface p-2 shadow-lift ring-1 ring-line">
          <p className="truncate px-3 py-2 text-small text-ink-700">{user.email}</p>
          <button type="button" onClick={() => { setOpen(false); setProfileOpen(true); }} className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left font-semibold text-ink-900 hover:bg-sand">
            <UserRound aria-hidden="true" className="size-4" /> Profile
          </button>
          <button type="button" onClick={logout} className="flex w-full items-center gap-2 rounded-sm px-3 py-2 text-left font-semibold text-ink-900 hover:bg-sand">
            <LogOut aria-hidden="true" className="size-4" /> Log out
          </button>
        </div>
      )}

      <Modal open={profileOpen} onClose={() => setProfileOpen(false)} title="Your profile" footer={<Button variant="secondary" onClick={() => setProfileOpen(false)}>Close</Button>}>
        <div className="flex items-center gap-4">
          <Avatar name={user.full_name} size="lg" />
          <div className="min-w-0">
            <p className="font-heading text-h3 font-bold text-ink-900">{user.full_name}</p>
            <p className="truncate text-ink-700">{user.email}</p>
            <Badge status="brand" className="mt-2 capitalize">{user.role}</Badge>
          </div>
        </div>
      </Modal>
    </div>
  );
}

/** Phones: fixed bottom tab bar. Extra links go into a "More" sheet. */
function MobileTabBar({ links }) {
  const [moreOpen, setMoreOpen] = useState(false);
  const location = useLocation();
  const alerts = useAlertCount();
  const tabs = links.length > MOBILE_TABS + 1 ? links.slice(0, MOBILE_TABS) : links;
  const extra = links.length > MOBILE_TABS + 1 ? links.slice(MOBILE_TABS) : [];
  const extraActive = extra.some((l) => location.pathname.startsWith(l.to));

  const tabClass = (active) =>
    cx("flex flex-1 flex-col items-center gap-0.5 rounded-md py-1.5 text-xs font-bold transition", active ? "text-ink-900" : "text-ink-700");
  const iconClass = (active) =>
    cx("flex h-8 w-12 items-center justify-center rounded-pill transition", active ? "bg-brand-500" : "");

  return (
    <nav aria-label="Main" className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-surface/95 px-2 pb-[env(safe-area-inset-bottom)] backdrop-blur lg:hidden">
      {moreOpen && (
        <ul className="absolute inset-x-3 bottom-full mb-2 animate-pop-in rounded-lg bg-surface p-2 shadow-lift ring-1 ring-line">
          {extra.map(({ to, label, icon: Icon }) => (
            <li key={to}>
              <NavLink to={to} onClick={() => setMoreOpen(false)} className={({ isActive }) => cx("flex items-center gap-3 rounded-md px-3 py-3 font-bold", isActive ? "bg-brand-50 text-ink-900" : "text-ink-700")}>
                <Icon aria-hidden="true" className="size-5" /> {label}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
      <div className="flex gap-1 py-1.5">
        {tabs.map(({ to, label, icon: Icon, end, badge }) => (
          <NavLink key={to} to={to} end={end} className={({ isActive }) => tabClass(isActive)}>
            {({ isActive }) => (
              <>
                <span className={cx(iconClass(isActive), "relative")}>
                  <Icon aria-hidden="true" className="size-5" />
                  {badge === "alerts" && <CountBadge count={alerts?.count} className="absolute -right-1 -top-1 !min-w-5 !px-1 !text-xs" />}
                </span>
                {label}
              </>
            )}
          </NavLink>
        ))}
        {extra.length > 0 && (
          <button type="button" aria-expanded={moreOpen} onClick={() => setMoreOpen(!moreOpen)} className={tabClass(extraActive || moreOpen)}>
            <span className={iconClass(extraActive)}><MoreHorizontal aria-hidden="true" className="size-5" /></span>
            More
          </button>
        )}
      </div>
    </nav>
  );
}
