/** /admin/users: search, filter by role, page through, activate/deactivate, and add counsellors. */
import { Search, UserPlus } from "lucide-react";
import { useCallback, useState } from "react";
import * as adminApi from "../../api/admin";
import AddCounsellorModal from "../../components/admin/AddCounsellorModal";
import ErrorNotice from "../../components/ErrorNotice";
import { Avatar, Badge, Button, Chip, EmptyState, Input, PageHeader, ResponsiveTable, Spinner, Switch, useToast } from "../../components/ui";
import { useAuth } from "../../context/AuthContext";
import useApi from "../../hooks/useApi";
import useDebouncedValue from "../../hooks/useDebouncedValue";
import { formatDate } from "../../utils/format";

const PAGE_SIZE = 10;
const ROLES = [["", "Everyone"], ["student", "Students"], ["counsellor", "Counsellors"], ["admin", "Admins"]];
const ROLE_BADGE = { student: "info", counsellor: "brand", admin: "neutral" };

export default function Users() {
  const toast = useToast();
  const { user: me } = useAuth();
  const [search, setSearch] = useState("");
  const [role, setRole] = useState("");
  const [page, setPage] = useState(1);
  const [adding, setAdding] = useState(false);
  const [togglingId, setTogglingId] = useState(null);
  const query = useDebouncedValue(search.trim(), 300); // search when typing pauses

  const load = useCallback(() => adminApi.users({ role, search: query, page, pageSize: PAGE_SIZE }), [role, query, page]);
  const { data, error, loading, refreshing, reload } = useApi(load);

  async function toggle(user) {
    setTogglingId(user.id);
    try {
      await adminApi.setUserActive(user.id, !user.is_active);
      toast(user.is_active ? `${user.full_name} deactivated` : `${user.full_name} activated`);
      await reload();
    } catch (e) {
      toast(e.message, "error");
    }
    setTogglingId(null);
  }

  const columns = [
    {
      id: "name", header: "Name", primary: true,
      cell: (u) => (
        <span className="flex items-center gap-3">
          <Avatar name={u.full_name} size="sm" /> <span className="min-w-0 break-words">{u.full_name}</span>
        </span>
      ),
    },
    { id: "email", header: "Email", cell: (u) => <span className="break-all text-ink-700">{u.email}</span> },
    { id: "role", header: "Role", cell: (u) => <Badge status={ROLE_BADGE[u.role]}><span className="capitalize">{u.role}</span></Badge> },
    { id: "joined", header: "Joined", cell: (u) => <span className="text-ink-700">{formatDate(u.created_at)}</span> },
    {
      id: "active", header: "Active", actions: true,
      cell: (u) => (
        <span className="inline-flex items-center gap-3">
          <span className="text-small text-ink-700">{u.is_active ? "Active" : "Inactive"}</span>
          <Switch
            label={`Account active for ${u.full_name}`}
            checked={u.is_active}
            onChange={() => toggle(u)}
            disabled={u.id === me.id || togglingId === u.id} // you can't lock yourself out
          />
        </span>
      ),
    },
  ];

  const pages = data ? Math.max(1, Math.ceil(data.total / PAGE_SIZE)) : 1;

  return (
    <div>
      <PageHeader
        title="Users"
        subtitle="Search people, switch accounts on or off, and add counsellors."
        action={<Button onClick={() => setAdding(true)}><UserPlus aria-hidden="true" className="size-5" /> Add counsellor</Button>}
      />

      <div className="mb-4 max-w-md">
        <label htmlFor="user-search" className="sr-only">Search by name or email</label>
        <div className="relative">
          <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-700" />
          <Input id="user-search" type="search" placeholder="Search by name or email" className="pl-12" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }} />
        </div>
      </div>
      <div role="group" aria-label="Filter by role" className="mb-6 flex flex-wrap gap-2">
        {ROLES.map(([value, label]) => (
          <Chip key={value || "all"} selected={role === value} onClick={() => { setRole(value); setPage(1); }}>{label}</Chip>
        ))}
      </div>

      {loading ? (
        <div className="flex justify-center py-16 text-brand-500"><Spinner size="lg" label="Loading users" /></div>
      ) : error ? (
        <div className="max-w-md space-y-4">
          <ErrorNotice>{error}</ErrorNotice>
          <Button variant="secondary" onClick={reload}>Try again</Button>
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState title="No one matches" text="Try a different name, or show everyone." action={<Button variant="secondary" onClick={() => { setSearch(""); setRole(""); setPage(1); }}>Clear filters</Button>} />
      ) : (
        <div aria-busy={refreshing} className={refreshing ? "opacity-60 transition" : "transition"}>
          <ResponsiveTable caption="Users" columns={columns} rows={data.items} rowKey={(u) => u.id} />
          <nav aria-label="Pages" className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p aria-live="polite" className="text-small text-ink-700">Page {data.page} of {pages} · {data.total} {data.total === 1 ? "person" : "people"}</p>
            <div className="flex gap-2">
              <Button variant="secondary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>Previous</Button>
              <Button variant="secondary" size="sm" disabled={page >= pages} onClick={() => setPage(page + 1)}>Next</Button>
            </div>
          </nav>
        </div>
      )}

      <AddCounsellorModal open={adding} onClose={() => setAdding(false)} onCreated={reload} />
    </div>
  );
}
