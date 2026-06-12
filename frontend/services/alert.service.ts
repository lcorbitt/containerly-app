import { EDGE_FUNCTION_SLUGS } from "@/lib/supabase/edge-function-slugs";
import { edgeFunctionFetch } from "@/lib/supabase/edge-functions";
import type { Alert } from "@/types/database";
import type {
  AcknowledgeAlertsResponse,
  ListAlertsResponse,
} from "@shared/dto/alert.dto";

async function parseEdgeJson<T>(result: { res: Response; text: string }): Promise<T> {
  if (!result.res.ok) {
    let message = result.res.statusText;
    try {
      const parsed = JSON.parse(result.text) as { error?: string };
      if (parsed.error) message = parsed.error;
    } catch {
      if (result.text) message = result.text;
    }
    throw new Error(message);
  }
  return JSON.parse(result.text) as T;
}

export async function fetchOrgAlertsPage(organizationId: string, limit = 50): Promise<Alert[]> {
  const params = new URLSearchParams({
    scope: "org",
    organization_id: organizationId,
    limit: String(limit),
  });
  const result = await edgeFunctionFetch(`${EDGE_FUNCTION_SLUGS.alerts.list}?${params}`);
  if ("error" in result) throw new Error(result.error);
  const body = await parseEdgeJson<ListAlertsResponse>(result);
  return (body.alerts ?? []) as Alert[];
}

export function orgAlertsRealtimeDedupeKey(organizationId: string): string {
  return `alerts:org:${organizationId}`;
}

export async function fetchMyAlertsPage(limit = 50): Promise<Alert[]> {
  const params = new URLSearchParams({ scope: "me", limit: String(limit) });
  const result = await edgeFunctionFetch(`${EDGE_FUNCTION_SLUGS.alerts.list}?${params}`);
  if ("error" in result) throw new Error(result.error);
  const body = await parseEdgeJson<ListAlertsResponse>(result);
  return (body.alerts ?? []) as Alert[];
}

export function myAlertsRealtimeDedupeKey(userId: string): string {
  return `alerts:me:${userId}`;
}

export async function acknowledgeAllMyAlerts(): Promise<{ acknowledged: number }> {
  const result = await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.alerts.acknowledgeAll, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "me" }),
  });
  if ("error" in result) throw new Error(result.error);
  const body = await parseEdgeJson<AcknowledgeAlertsResponse>(result);
  return { acknowledged: body.acknowledged ?? 0 };
}

export async function acknowledgeAlert(alertId: string): Promise<void> {
  const result = await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.alerts.acknowledge, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ alert_id: alertId }),
  });
  if ("error" in result) throw new Error(result.error);
  await parseEdgeJson<{ ok: true }>(result);
}

export async function acknowledgeAllOrgAlerts(organizationId: string): Promise<{ acknowledged: number }> {
  const result = await edgeFunctionFetch(EDGE_FUNCTION_SLUGS.alerts.acknowledgeAll, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ scope: "org", organization_id: organizationId }),
  });
  if ("error" in result) throw new Error(result.error);
  const body = await parseEdgeJson<AcknowledgeAlertsResponse>(result);
  return { acknowledged: body.acknowledged ?? 0 };
}
