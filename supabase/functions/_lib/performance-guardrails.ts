/**
 * Org performance guardrails for document workflow and reminders.
 */

import type { OrgPerformanceSettings } from "@shared/dto/performance.dto.ts";

export function missingRequiredDocumentTypes(
  requiredTypes: readonly string[],
  uploadedDocumentTypes: readonly string[],
): string[] {
  if (requiredTypes.length === 0) return [];
  const uploaded = new Set(uploadedDocumentTypes.map((t) => t.trim().toLowerCase()));
  return requiredTypes.filter((t) => !uploaded.has(t.trim().toLowerCase()));
}

export function canAdvanceToApproved(
  settings: OrgPerformanceSettings,
  uploadedDocumentTypes: readonly string[],
): { ok: true } | { ok: false; missing: string[] } {
  const missing = missingRequiredDocumentTypes(
    settings.required_document_types,
    uploadedDocumentTypes,
  );
  if (missing.length === 0) return { ok: true };
  return { ok: false, missing };
}
