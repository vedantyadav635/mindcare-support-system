/** /app/resources: "For you" recommendations on top, then the full library with type chips and search. */
import { Search } from "lucide-react";
import { useState } from "react";
import * as recommendationsApi from "../../api/recommendations";
import * as resourcesApi from "../../api/resources";
import ErrorNotice from "../../components/ErrorNotice";
import { filterResources } from "../../components/resources/filter";
import ResourceDetail from "../../components/resources/ResourceDetail";
import { FILTER_ORDER, TYPE_INFO } from "../../components/resources/resourceTypes";
import ResourceCard from "../../components/ResourceCard";
import { Button, Chip, Disclaimer, EmptyState, Input, PageHeader, Spinner } from "../../components/ui";
import useApi from "../../hooks/useApi";

// Defined outside the component so useApi sees the same function on every render
const loadForYou = () => recommendationsApi.list(3);
const loadLibrary = () => resourcesApi.list();

export default function Resources() {
  const forYou = useApi(loadForYou);
  const library = useApi(loadLibrary);
  const [selected, setSelected] = useState(null); // the resource open in the detail dialog
  const [type, setType] = useState(""); // "" = all types
  const [query, setQuery] = useState("");

  const shown = library.data ? filterResources(library.data, type, query) : [];
  const clearFilters = () => { setType(""); setQuery(""); };

  return (
    <div>
      <PageHeader title="Explore" subtitle="Small things that can help, whenever you need them." />

      {/* ---------- For you ---------- */}
      <section aria-labelledby="for-you-title" className="mb-14">
        <h2 id="for-you-title" className="mb-4">For you</h2>
        {/* Recommendation screens always show the non-diagnostic disclaimer */}
        <Disclaimer className="mb-6" />
        {forYou.loading ? (
          <div className="flex justify-center py-10 text-brand-500"><Spinner label="Loading suggestions" /></div>
        ) : forYou.error ? (
          <div className="max-w-md space-y-4">
            <ErrorNotice>{forYou.error}</ErrorNotice>
            <Button variant="secondary" onClick={forYou.reload}>Try again</Button>
          </div>
        ) : forYou.data.length === 0 ? (
          <EmptyState title="No suggestions yet" text="Check in for a few days and we'll pick things that suit you." />
        ) : (
          <ul className="grid gap-6 md:grid-cols-3">
            {forYou.data.map(({ resource, why }) => (
              <li key={resource.id}><ResourceCard resource={resource} why={why} onOpen={setSelected} /></li>
            ))}
          </ul>
        )}
      </section>

      {/* ---------- Library ---------- */}
      <section aria-labelledby="library-title">
        <h2 id="library-title" className="mb-4">Library</h2>

        <div className="mb-4 max-w-md">
          <label htmlFor="resource-search" className="sr-only">Search resources</label>
          <div className="relative">
            <Search aria-hidden="true" className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-700" />
            <Input
              id="resource-search"
              type="search"
              placeholder="Search, e.g. sleep, calm, exams"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="pl-12"
            />
          </div>
        </div>

        <div role="group" aria-label="Filter by type" className="mb-6 flex flex-wrap gap-2">
          <Chip selected={type === ""} onClick={() => setType("")}>All</Chip>
          {FILTER_ORDER.map((key) => (
            <Chip key={key} icon={TYPE_INFO[key].icon} selected={type === key} onClick={() => setType(type === key ? "" : key)}>
              {TYPE_INFO[key].filter}
            </Chip>
          ))}
        </div>

        {library.loading ? (
          <div className="flex justify-center py-16 text-brand-500"><Spinner size="lg" label="Loading the library" /></div>
        ) : library.error ? (
          <div className="max-w-md space-y-4">
            <ErrorNotice>{library.error}</ErrorNotice>
            <Button variant="secondary" onClick={library.reload}>Try again</Button>
          </div>
        ) : library.data.length === 0 ? (
          <EmptyState title="The library is empty" text="Resources will appear here once they are added. Please check back soon." />
        ) : shown.length === 0 ? (
          <EmptyState
            title="Nothing matches that"
            text="Try a different word, or look at all types."
            action={<Button variant="secondary" onClick={clearFilters}>Clear filters</Button>}
          />
        ) : (
          <>
            <p aria-live="polite" className="mb-4 text-small text-ink-700">
              {shown.length} {shown.length === 1 ? "resource" : "resources"}
            </p>
            <ul className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {shown.map((resource) => (
                <li key={resource.id}><ResourceCard resource={resource} onOpen={setSelected} /></li>
              ))}
            </ul>
          </>
        )}
      </section>

      <ResourceDetail resource={selected} onClose={() => setSelected(null)} />
    </div>
  );
}
