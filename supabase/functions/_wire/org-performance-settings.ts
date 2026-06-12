import {
  DEFAULT_ORG_PERFORMANCE_SETTINGS,
  type OrgPerformanceSettings,
} from "@shared/dto/performance.dto.ts";

export function parseOrgPerformanceSettings(raw: unknown): OrgPerformanceSettings {
  if (!raw || typeof raw !== "object") return { ...DEFAULT_ORG_PERFORMANCE_SETTINGS };

  const row = raw as Record<string, unknown>;
  const sla = Number(row.sla_response_hours);
  const stale = Number(row.stale_update_reminder_hours);
  const requiredRaw = row.required_document_types;

  return {
    sla_response_hours:
      Number.isFinite(sla) && sla > 0 ? Math.round(sla) : DEFAULT_ORG_PERFORMANCE_SETTINGS.sla_response_hours,
    stale_update_reminder_hours:
      Number.isFinite(stale) && stale > 0
        ? Math.round(stale)
        : DEFAULT_ORG_PERFORMANCE_SETTINGS.stale_update_reminder_hours,
    required_document_types: Array.isArray(requiredRaw)
      ? requiredRaw.filter((v): v is string => typeof v === "string" && v.trim().length > 0).slice(0, 20)
      : [],
  };
}
