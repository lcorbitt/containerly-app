import { normalizeShipmentTag, SHIPMENT_TAG_PRESETS } from "@/utils/shipment-tags";

function mergedSuggestionPool(orgTags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const tag of [...SHIPMENT_TAG_PRESETS, ...orgTags]) {
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
  }
  return out;
}

/** Org tags + curated presets not on this shipment; empty query returns all available matches. */
export function filterTagSuggestions(
  orgTags: string[],
  currentTags: string[],
  query: string,
): string[] {
  const q = query.trim().toLowerCase();
  const current = new Set(currentTags.map((t) => t.toLowerCase()));
  return mergedSuggestionPool(orgTags).filter((tag) => {
    if (current.has(tag.toLowerCase())) return false;
    if (!q) return true;
    return tag.toLowerCase().includes(q);
  });
}

export function availableTagPresets(currentTags: string[]): string[] {
  const current = new Set(currentTags.map((t) => t.toLowerCase()));
  return SHIPMENT_TAG_PRESETS.filter((tag) => !current.has(tag.toLowerCase()));
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
