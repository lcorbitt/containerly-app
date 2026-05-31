export const SHIPMENT_TAG_MAX_COUNT = 20;
export const SHIPMENT_TAG_MAX_LENGTH = 40;

const TAG_PATTERN = /^[\p{L}\p{N}\s\-_.]+$/u;

/** Normalize a single tag for storage (trim, collapse spaces, validate). */
export function normalizeShipmentTag(raw: string): string | null {
  const trimmed = raw.trim().replace(/\s+/g, " ");
  if (!trimmed || trimmed.length > SHIPMENT_TAG_MAX_LENGTH) return null;
  if (!TAG_PATTERN.test(trimmed)) return null;
  return trimmed;
}

/** Deduplicate tags case-insensitively while preserving first-seen casing. */
export function normalizeShipmentTagList(tags: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];

  for (const raw of tags) {
    const tag = normalizeShipmentTag(raw);
    if (!tag) continue;
    const key = tag.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(tag);
    if (out.length >= SHIPMENT_TAG_MAX_COUNT) break;
  }

  return out;
}

/** Split comma/semicolon/newline-separated input into normalized tags. */
export function parseShipmentTagInput(text: string): string[] {
  return normalizeShipmentTagList(text.split(/[,;\n]+/));
}

export function mergeShipmentTags(existing: string[], incoming: string[]): string[] {
  return normalizeShipmentTagList([...existing, ...incoming]);
}

export function removeShipmentTag(existing: string[], tagToRemove: string): string[] {
  const key = tagToRemove.toLowerCase();
  return existing.filter((t) => t.toLowerCase() !== key);
}
