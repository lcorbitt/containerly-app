import { normalizeShipmentTag } from "@/utils/shipment-tags";

/** Org tags not on this shipment; empty query returns all available matches. */
export function filterTagSuggestions(
  orgTags: string[],
  currentTags: string[],
  query: string,
): string[] {
  const q = query.trim().toLowerCase();
  const current = new Set(currentTags.map((t) => t.toLowerCase()));
  return orgTags.filter((tag) => {
    if (current.has(tag.toLowerCase())) return false;
    if (!q) return true;
    return tag.toLowerCase().includes(q);
  });
}

export function tagFromDraftInput(draft: string): string | null {
  const token = draft.split(/[,;\n]/)[0] ?? "";
  return normalizeShipmentTag(token);
}

export function hasTagSuggestions(
  orgTags: string[],
  currentTags: string[],
  query: string,
): boolean {
  return filterTagSuggestions(orgTags, currentTags, query).length > 0;
}
