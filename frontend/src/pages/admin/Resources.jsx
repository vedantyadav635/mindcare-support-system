/** /admin/resources: the wellness resources, as a table (cards on phones). Add, edit, hide. */
import { EyeOff, Pencil, Plus } from "lucide-react";
import { useState } from "react";
import * as resourcesApi from "../../api/resources";
import ResourceFormModal from "../../components/admin/ResourceFormModal";
import ConfirmModal from "../../components/ConfirmModal";
import ErrorNotice from "../../components/ErrorNotice";
import { tagLabel, typeInfo } from "../../components/resources/resourceTypes";
import { Badge, Button, Chip, EmptyState, PageHeader, ResponsiveTable, Spinner, useToast } from "../../components/ui";
import useApi from "../../hooks/useApi";

const loadAll = () => resourcesApi.list();

export default function AdminResources() {
  const toast = useToast();
  const list = useApi(loadAll);
  const [editor, setEditor] = useState({ open: false, resource: null });
  const [confirm, setConfirm] = useState(null);
  const [busy, setBusy] = useState(false);

  function askToHide(resource) {
    setConfirm({
      title: "Hide this resource?",
      text: `"${resource.title}" will no longer be shown to students. Hidden resources can't be brought back from this screen yet.`,
      confirmLabel: "Hide resource",
      cancelLabel: "Keep it",
      onConfirm: async () => {
        setBusy(true);
        try {
          await resourcesApi.remove(resource.id);
          toast("Resource hidden");
          await list.reload();
        } catch (e) {
          toast(e.message, "error");
        }
        setBusy(false);
        setConfirm(null);
      },
    });
  }

  function saved(_, wasEditing) {
    setEditor({ open: false, resource: null });
    toast(wasEditing ? "Resource updated" : "Resource added");
    list.reload();
  }

  const columns = [
    { id: "title", header: "Title", primary: true, cell: (r) => <span className="break-words">{r.title}</span> },
    {
      id: "type", header: "Type",
      cell: (r) => { const { icon: Icon, filter } = typeInfo(r.type); return <Badge status="neutral"><Icon aria-hidden="true" className="size-3.5" /> {filter}</Badge>; },
    },
    {
      id: "tags", header: "Tags",
      cell: (r) => r.tags.length ? <ul className="flex flex-wrap justify-end gap-1.5 md:justify-start">{r.tags.map((t) => <li key={t}><Chip>{tagLabel(t)}</Chip></li>)}</ul> : <span className="text-ink-700">None</span>,
    },
    { id: "link", header: "Link", cell: (r) => (r.url ? "Yes" : <span className="text-ink-700">No</span>) },
    {
      id: "actions", header: "Actions", actions: true,
      cell: (r) => (
        <span className="inline-flex flex-wrap gap-2">
          <Button variant="secondary" size="sm" onClick={() => setEditor({ open: true, resource: r })} aria-label={`Edit ${r.title}`}><Pencil aria-hidden="true" className="size-4" /> Edit</Button>
          <Button variant="ghost" size="sm" onClick={() => askToHide(r)} aria-label={`Hide ${r.title}`}><EyeOff aria-hidden="true" className="size-4" /> Hide</Button>
        </span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader
        title="Resources"
        subtitle="The wellness resources students can find and be recommended."
        action={<Button onClick={() => setEditor({ open: true, resource: null })}><Plus aria-hidden="true" className="size-5" /> Add resource</Button>}
      />

      {list.loading ? (
        <div className="flex justify-center py-16 text-brand-500"><Spinner size="lg" label="Loading resources" /></div>
      ) : list.error ? (
        <div className="max-w-md space-y-4">
          <ErrorNotice>{list.error}</ErrorNotice>
          <Button variant="secondary" onClick={list.reload}>Try again</Button>
        </div>
      ) : list.data.length === 0 ? (
        <EmptyState title="No resources yet" text="Add the first one, or run the seed script for a starter set." action={<Button onClick={() => setEditor({ open: true, resource: null })}>Add a resource</Button>} />
      ) : (
        <ResponsiveTable caption="Resources" columns={columns} rows={list.data} rowKey={(r) => r.id} />
      )}

      <ResourceFormModal open={editor.open} resource={editor.resource} onClose={() => setEditor({ open: false, resource: null })} onSaved={saved} />
      <ConfirmModal request={confirm} busy={busy} onClose={() => !busy && setConfirm(null)} />
    </div>
  );
}
