import {
  formatDocumentGroupLabel,
  formatDocumentTypeLabel,
} from "@/utils/document-metadata-display";

export { formatDocumentGroupLabel, formatDocumentTypeLabel };

export function hasDocumentMetadata(
  documentType: string | null | undefined,
  documentGroup: string | null | undefined,
): boolean {
  return Boolean(formatDocumentTypeLabel(documentType) || formatDocumentGroupLabel(documentGroup));
}
