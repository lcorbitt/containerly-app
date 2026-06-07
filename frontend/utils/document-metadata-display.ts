import { SHIPMENT_DOCUMENT_TYPES } from "@shared/dto/logistics.dto";

function titleCaseWords(value: string): string {
  return value
    .trim()
    .replace(/_/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(" ");
}

const DOCUMENT_TYPE_BY_LOWER = new Map(
  SHIPMENT_DOCUMENT_TYPES.map((type) => [type.toLowerCase(), type]),
);

const DOCUMENT_GROUP_LABELS: Record<string, string> = {
  draft: "Draft",
  revision: "Revision",
  original: "Original",
};

/** Title Case label for stored `document_type` values (select options, pills, timeline). */
export function formatDocumentTypeLabel(documentType: string | null | undefined): string | null {
  const trimmed = documentType?.trim();
  if (!trimmed) return null;
  return DOCUMENT_TYPE_BY_LOWER.get(trimmed.toLowerCase()) ?? titleCaseWords(trimmed);
}

/** Title Case label for stored `document_group` values (select options, pills, timeline). */
export function formatDocumentGroupLabel(
  documentGroup: string | null | undefined,
): string | null {
  const normalized = documentGroup?.trim().toLowerCase() ?? "";
  if (!normalized) return null;
  return DOCUMENT_GROUP_LABELS[normalized] ?? titleCaseWords(documentGroup!.trim());
}
