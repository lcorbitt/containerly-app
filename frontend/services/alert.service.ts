import { apiJson } from "@/utils/api-client";
import type { Alert } from "@/types/database";

export async function fetchOrgAlertsPage(organizationId: string, limit = 50): Promise<Alert[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const { alerts } = await apiJson<{ alerts: Alert[] }>(
    `/api/organizations/${encodeURIComponent(organizationId)}/alerts?${params}`,
  );
  return alerts ?? [];
}

export function orgAlertsRealtimeDedupeKey(organizationId: string): string {
  return `alerts:org:${organizationId}`;
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  await apiJson<{ ok: true }>(`/api/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
    method: "PATCH",
  });
}
