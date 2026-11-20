/**
 * Library filtering, done in the browser (the library is small, so it feels instant).
 *   type:  "" for all, or a resource type such as "breathing"
 *   query: words typed in the search box. Every word must appear in the title, text, tags or type.
 */
export function filterResources(resources, type, query) {
  const words = query.toLowerCase().split(/\s+/).filter(Boolean);
  return resources.filter((resource) => {
    if (type && resource.type !== type) return false;
    if (words.length === 0) return true;
    const haystack = [resource.title, resource.body ?? "", resource.tags.join(" ").replaceAll("_", " "), resource.type].join(" ").toLowerCase();
    return words.every((word) => haystack.includes(word));
  });
}
