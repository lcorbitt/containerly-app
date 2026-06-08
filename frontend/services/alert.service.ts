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

export async function fetchMyAlertsPage(limit = 50): Promise<Alert[]> {
  const params = new URLSearchParams({ limit: String(limit) });
  const { alerts } = await apiJson<{ alerts: Alert[] }>(`/api/me/alerts?${params}`);
  return alerts ?? [];
}

export function myAlertsRealtimeDedupeKey(userId: string): string {
  return `alerts:me:${userId}`;
}

export async function acknowledgeAllMyAlerts(): Promise<{ acknowledged: number }> {
  return apiJson<{ ok: true; acknowledged: number }>(`/api/me/alerts/acknowledge-all`, {
    method: "PATCH",
  });
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  await apiJson<{ ok: true }>(`/api/alerts/${encodeURIComponent(alertId)}/acknowledge`, {
    method: "PATCH",
  });
}

export async function acknowledgeAllOrgAlerts(organizationId: string): Promise<{ acknowledged: number }> {
  return apiJson<{ ok: true; acknowledged: number }>(
    `/api/organizations/${encodeURIComponent(organizationId)}/alerts/acknowledge-all`,
    { method: "PATCH" },
  );
}
