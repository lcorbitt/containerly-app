export function formatDocumentGroupLabel(group: string | null | undefined): string | null {
  const normalized = group?.trim().toLowerCase() ?? "";
  if (!normalized) return null;
  if (normalized === "draft") return "Draft";
  if (normalized === "revision") return "Revision";
  if (normalized === "original") return "Original";
  return group!.trim();
}

export function hasDocumentMetadata(
  documentType: string | null | undefined,
  documentGroup: string | null | undefined,
): boolean {
  return Boolean(documentType?.trim() || formatDocumentGroupLabel(documentGroup));
}
