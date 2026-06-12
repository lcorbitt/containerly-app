import type { SupabaseClient } from "@supabase/supabase-js";
import {
  acknowledgeAlertById,
  acknowledgeAllMyAlerts,
  acknowledgeAllOrgAlertsForViewer,
  listMyAlertsPage,
  listOrgAlertsPageForViewer,
} from "@models/alerts.ts";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function clampLimit(raw: number | undefined): number {
  const n = Number(raw ?? 50) || 50;
  return Math.min(200, Math.max(1, n));
}

export async function fetchAlertsPage(
  client: SupabaseClient,
  viewerUserId: string,
  args: { scope: "org" | "me"; organizationId?: string; limit?: number },
): Promise<{ ok: true; alerts: Record<string, unknown>[] } | { ok: false; error: string; status: number }> {
  const limit = clampLimit(args.limit);

  if (args.scope === "me") {
    const { data, error } = await listMyAlertsPage(client, viewerUserId, limit);
    if (error) return { ok: false, error: error.message, status: 500 };
    return { ok: true, alerts: (data ?? []) as unknown as Record<string, unknown>[] };
  }

  const organizationId = args.organizationId?.trim() ?? "";
  if (!organizationId || !UUID_RE.test(organizationId)) {
    return { ok: false, error: "Invalid organization_id", status: 400 };
  }

  const { data, error } = await listOrgAlertsPageForViewer(
    client,
    organizationId,
    viewerUserId,
    limit,
  );
  if (error) return { ok: false, error: error.message, status: 500 };
  return { ok: true, alerts: (data ?? []) as unknown as Record<string, unknown>[] };
}

export async function acknowledgeOneAlert(
  client: SupabaseClient,
  viewerUserId: string,
  alertId: string,
): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const id = alertId.trim();
  if (!id || !UUID_RE.test(id)) {
    return { ok: false, error: "Invalid alert_id", status: 400 };
  }

  const { error } = await acknowledgeAlertById(client, id, viewerUserId);
  if (error) return { ok: false, error: error.message, status: 400 };
  return { ok: true };
}

export async function acknowledgeAllAlertsForViewer(
  client: SupabaseClient,
  viewerUserId: string,
  args: { scope: "org" | "me"; organizationId?: string },
): Promise<
  { ok: true; acknowledged: number } | { ok: false; error: string; status: number }
> {
  if (args.scope === "me") {
    const result = await acknowledgeAllMyAlerts(client, viewerUserId);
    if (result.error) return { ok: false, error: result.error, status: 500 };
    return { ok: true, acknowledged: result.acknowledged };
  }

  const organizationId = args.organizationId?.trim() ?? "";
  if (!organizationId || !UUID_RE.test(organizationId)) {
    return { ok: false, error: "Invalid organization_id", status: 400 };
  }

  const result = await acknowledgeAllOrgAlertsForViewer(client, organizationId, viewerUserId);
  if (result.error) return { ok: false, error: result.error, status: 500 };
  return { ok: true, acknowledged: result.acknowledged };
}
